from flask import Flask, jsonify, request, render_template_string, abort
from ariadne import QueryType, graphql_sync, make_executable_schema
from graphql_app.resolvers import Resolvers  
from flask_cors import CORS
from graphql_app.schema import type_defs
from .db_logic import get_connection, fetch_data, format_dates, get_project_service_attributes, get_project_milestone_dates
import pandas as pd
from .queries import QUERIES
from werkzeug.exceptions import HTTPException
import datetime

# Set up resolvers
query = QueryType()
query.set_field("projectOverview", Resolvers.resolve_project_overview)
query.set_field("projectsWithFollowUpDates", Resolvers.resolve_projects_with_follow_up_dates)
query.set_field("servicesStarted", Resolvers.resolve_services_started)
query.set_field("projectsNotStarted", Resolvers.resolve_projects_not_started)
query.set_field("completedProjects", Resolvers.resolve_completed_projects)
query.set_field("projectTimeline", Resolvers.resolve_project_timeline)
query.set_field("projectServices", Resolvers.resolve_all_project_services)

# Create the executable schema
schema = make_executable_schema(type_defs, query)

# Set up Flask app
app = Flask(__name__)

# HTML for GraphQL Playground
PLAYGROUND_HTML = """
<!DOCTYPE html>
<html>
  <head>
    <meta charset=utf-8/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GraphQL Playground</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
    <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.addEventListener('load', function () {
        GraphQLPlayground.init(document.getElementById('root'), { endpoint: '/graphql' });
      });
    </script>
  </body>
</html>
"""

@app.errorhandler(HTTPException)
def handle_exception(e):
    """Return JSON instead of HTML for HTTP errors."""
    response = e.get_response()
    response.data = jsonify({
        "code": e.code,
        "name": e.name,
        "description": e.description,
    }).get_data(as_text=True)
    response.content_type = "application/json"
    return response

@app.route("/")
def home():
    """Serve a simple homepage."""
    return "<h1>Welcome to the GraphQL API</h1><p>Go to <a href='/graphql'>/graphql</a> for the GraphQL Playground.</p>"

@app.route("/graphql", methods=["GET"])
def graphql_playground():
    """Serve GraphQL Playground."""
    return render_template_string(PLAYGROUND_HTML), 200

@app.route("/graphql", methods=["POST"])
def graphql_server():
    try:
        data = request.get_json()
        success, result = graphql_sync(schema, data, context_value=request, debug=True)
        status_code = 200 if success else 400
        return jsonify(result), status_code
    except Exception as e:
        print("Error:", e)  # Log any exceptions
        return jsonify({"error": str(e)}), 400

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')

@app.route("/api/data/<query_name>", methods=["GET"])
def get_specific_data(query_name: str):
    if query_name not in QUERIES:
        abort(404, description=f"Query '{query_name}' not found")
        
    try:
        connection = get_connection()
        if connection is None:
            abort(500, description="Database connection failed")
            
        df = fetch_data(QUERIES[query_name], connection)
        if query_name in ['summary', 'duration', 'project-service-attributes', 'project-service']:
            date_columns = []
            if query_name == 'duration':
                date_columns = ['CreateAt']
            elif query_name == 'summary':
                date_columns = ['SubmissionDate', 'VettingCall','ConsultationCall']
            elif query_name == 'project-service-attributes':
                date_columns = ['Value', 'UpdatedAt']
            elif query_name == 'project-service':
                date_columns = ['ServiceStartDate', 'FollowUpDate', 'CompleteDate']
            if date_columns:
                print(f"Formatting dates for query: {query_name}, date columns: {date_columns}")
                df = format_dates(df, date_columns)
        return jsonify(df.to_dict(orient='records'))
        
    except Exception as e:
        print("Error:", e)  # Log any exceptions
        abort(500, description=str(e))
    finally:
        if connection:
            connection.close()

@app.route('/api/active-users', methods=['GET'])
def get_active_users():
    time_range = request.args.get('time_range', default=7, type=int)
    if not time_range:
        return jsonify({'error': 'Missing time_range parameter'}), 400
    
    try:
        conn = get_connection()
        active_users_query = """
            SELECT u.UserId, u.ProperName, r.Name as 'RoleName', COALESCE(u.LastLoginAt, 'Never logged in') AS LastLoginAt
            FROM cleantranscrm.`User` u 
            LEFT JOIN cleantranscrm.UserRole ur ON ur.UserId = u.UserId 
            LEFT JOIN cleantranscrm.`Role` r ON r.RoleId = ur.RoleId 
            WHERE u.Active = 1
            ORDER BY r.RoleId ASC, u.ProperName ASC;
        """
        active_users = fetch_data(active_users_query, conn).to_dict(orient='records')

        user_activity_count_query = """
            SELECT UserId, COUNT(*) AS activity_count
            FROM cleantranscrm.Activity A
            WHERE CreatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
            GROUP BY UserId;
        """
        activity_count = fetch_data(user_activity_count_query, conn, params=(time_range,)).to_dict(orient='records')

        user_uploaded_files_count_query = """
            SELECT StoredByUserId as 'UserId', COUNT(*) AS uploaded_files_count
            FROM cleantranscrm.Attachment a 
            WHERE TimeStored >= DATE_SUB(CURDATE(), INTERVAL %s DAY) AND a.ProjectId is not null
            GROUP BY UserId;
        """
        uploaded_files_count = fetch_data(user_uploaded_files_count_query, conn, params=(time_range,)).to_dict(orient='records')

        attributes_filled_count_query = """
            SELECT u.UserId, COUNT(*) AS attributes_filled_count
            FROM cleantranscrm.ProjectAttributeValue pav
            LEFT JOIN cleantranscrm.`User` u ON u.ProperName = pav.UpdatedBy 
            WHERE pav.UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
            GROUP BY u.UserId;
        """
        attributes_filled_count = fetch_data(attributes_filled_count_query, conn, params=(time_range,)).to_dict(orient='records')

        project_table_values_count_query = """
            SELECT u.UserId, COUNT(*) AS project_table_values_count
            FROM cleantranscrm.ProjectTableValue ptv
            LEFT JOIN cleantranscrm.`User` u ON u.ProperName = ptv.UpdatedBy
            WHERE ptv.UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
            GROUP BY u.UserId;
        """
        project_table_values_count = fetch_data(project_table_values_count_query, conn, params=(time_range,)).to_dict(orient='records')

        cursor = conn.cursor()
        cursor.execute("SELECT ProperName FROM cleantranscrm.`User`")
        proper_names = cursor.fetchall()
        user_mentions_count = []

        for proper_name in proper_names:
            like_pattern = f"%@{proper_name[0]}%"
            user_mentions_count_query = """
                SELECT u.UserId, COUNT(*) AS user_mention_count
                FROM cleantranscrm.Activity a
                LEFT JOIN cleantranscrm.ActivityType at2 ON at2.ActivityTypeId = a.ActivityTypeId
                LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId
                LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId
                LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = a.PhaseId AND pp.ProgramId = a.ProgramId
                LEFT JOIN cleantranscrm.`User` u ON u.UserId = a.UserId 
                WHERE a.`Text` LIKE %s
                AND a.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY u.UserId;
            """
            mention_count = fetch_data(user_mentions_count_query, conn, params=(like_pattern, time_range)).to_dict(orient='records')
            user_mentions_count.extend(mention_count)

        # Convert all counts to dictionaries for easy lookup
        activity_count_dict = {item['UserId']: item['activity_count'] for item in activity_count}
        uploaded_files_count_dict = {item['UserId']: item['uploaded_files_count'] for item in uploaded_files_count}
        attributes_filled_count_dict = {item['UserId']: item['attributes_filled_count'] for item in attributes_filled_count}
        project_table_values_count_dict = {item['UserId']: item['project_table_values_count'] for item in project_table_values_count}
        user_mentions_count_dict = {item['UserId']: item['user_mention_count'] for item in user_mentions_count}

        # Merge all counts into active users
        for user in active_users:
            user['activity_count'] = activity_count_dict.get(user['UserId'], 0)
            user['uploaded_files_count'] = uploaded_files_count_dict.get(user['UserId'], 0)
            user['attributes_filled_count'] = attributes_filled_count_dict.get(user['UserId'], 0)
            user['project_table_values_count'] = project_table_values_count_dict.get(user['UserId'], 0)
            user['user_mention_count'] = user_mentions_count_dict.get(user['UserId'], 0)

        return jsonify({
            "active_users": active_users
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = get_connection()
        active_projects_query = """
            select
            	p.ProjectId, p.ProjectNumber , p.Name as 'ProjectName', ps.LongName as 'ProjectStatus', p2.Name as 'ProgramName', o.Name as 'OrgName', u.ProperName as 'ProjectLead', pp.Name as 'PhaseName'
            from cleantranscrm.Project p 
            left join cleantranscrm.ProjectStatus ps on ps.ProjectStatusId = p.Status 
            left join cleantranscrm.Program p2 on p2.ProgramId = p.ProgramId 
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = p.CurrentPhaseId and pp.ProgramId = p.ProgramId 
            left JOIN cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            left join cleantranscrm.ProjectRole pr on pr.ProjectId = p.ProjectId 
            left join cleantranscrm.`Role` r on r.RoleId = pr.RoleId 
            left join cleantranscrm.`User` u on u.UserId = pr.UserId 
            where p.Deleted = 0 and pr.RoleId = 1;
        """
        active_projects = fetch_data(active_projects_query, conn).to_dict(orient='records')

        return jsonify({"projects": active_projects})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

            

@app.route('/api/data/project-service-attributes', methods=['GET'])
def project_service_attributes():
    projectId = request.args.get('projectId')
    serviceName = request.args.get('serviceName')
    if not projectId or not serviceName:
        return jsonify({'error': 'Missing projectId or serviceName'}), 400
    try:
        connection = get_connection()
        data = get_project_service_attributes(connection, projectId, serviceName)
        return data.to_json(orient='records')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/data/project-milestone-dates', methods=['GET'])
def project_milestone_dates():
    projectId = request.args.get('projectId')
    if not projectId:
        return jsonify({'error': 'Missing projectId'}), 400
    try:
        connection = get_connection()
        data = get_project_milestone_dates(connection, projectId)
        date_columns = ['Value', 'UpdatedAt']
        df = format_dates(data, date_columns)
        return df.to_json(orient='records')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/stats', methods=['GET'])
def get_stats():
    time_range = request.args.get('time_range', default=30, type=int)
    user_id = request.args.get('user_id')
    if not time_range or not user_id:
        return jsonify({'error': 'Missing time_range or user_id parameter'}), 400

    try:
        conn = get_connection()

        # Activity count
        activity_count_query = """
            SELECT COUNT(*) AS activity_count
            FROM cleantranscrm.Activity A
            WHERE ProjectId IS NOT NULL AND UserId = %s AND CreatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        activity_count = int(fetch_data(activity_count_query, conn, params=(user_id, time_range)).iloc[0]['activity_count'])

        # Activity logs
        activity_logs_query = """
            SELECT a.UserId, a.`Text`, a.CreatedAt, COALESCE(at2.Name, 'Note') as 'ActivityType', COALESCE(a.Duration, 0) as 'Duration', COALESCE(pp.PhaseId,0) AS 'PhaseId', 
                   pp.Name as 'PhaseName', p.ProjectId,  p.ProjectNumber, p.Name as 'ProjectName', o.Name as 'OrgName'
            FROM cleantranscrm.Activity a
            LEFT JOIN cleantranscrm.ActivityType at2 on at2.ActivityTypeId = a.ActivityTypeId 
            LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId
            LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = a.PhaseId AND pp.ProgramId = a.ProgramId
            WHERE a.ProjectId IS NOT NULL AND a.UserId = %s AND a.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        activity_logs = fetch_data(activity_logs_query, conn, params=(user_id, time_range)).to_dict(orient='records')

        # Uploaded files count
        uploaded_files_count_query = """
            SELECT COUNT(*) AS uploaded_files_count
            FROM cleantranscrm.Attachment a 
            WHERE StoredByUserId = %s AND TimeStored >= DATE_SUB(CURDATE(), INTERVAL %s DAY) AND a.ProjectId is not null;
        """
        uploaded_files_count = int(fetch_data(uploaded_files_count_query, conn, params=(user_id, time_range)).iloc[0]['uploaded_files_count'])

        # Uploaded files details
        uploaded_files_query = """
            SELECT B.Label ,a.AttachmentId , a.Title , a.TimeStored , a.StoredByUserId, a.Filename, a.Description 
                , COALESCE(pp.PhaseId,0) AS 'PhaseId'
                , pp.Name as 'PhaseName'
                , CASE 
                    when p.ProjectId is not null then p.ProjectId 
                    ELSE (select p.ProjectId from cleantranscrm.Project p where p.ProjectId = a2.Projectid)
                END as 'ProjectId'
                , CASE 
                    when p.ProjectNumber is not null then p.ProjectNumber 
                    ELSE (select p.ProjectNumber from cleantranscrm.Project p where p.ProjectId = a2.Projectid)
                END as 'ProjectNumber'
                , CASE 
                    when p.Name is not null then p.Name 
                    ELSE (select p.Name from cleantranscrm.Project p where p.ProjectId = a2.Projectid)
                END as 'ProjectName'
                , o.Name as 'OrgName'
            FROM cleantranscrm.Attachment a 
            left join cleantranscrm.Project p on p.ProjectId = a.ProjectId 
            left join cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            left join cleantranscrm.ProgramPhase pp on pp.PhaseId = a.PhaseId and pp.ProgramId = a.ProgramId 
            left join cleantranscrm.Activity a2 on a2.AttachmentId = a.AttachmentId 
            left join (select pav.ProjectId, pav.UpdatedAt, pav.UpdatedBy, pav.Value, pa.Label from cleantranscrm.ProjectAttributeValue pav 
                left join cleantranscrm.ProgramAttribute pa on pa.ProgramAttributeId = pav.ProgramAttributeId 
                where pa.ControlType = 'doc') B on B.Value = a.AttachmentId 
            WHERE a.StoredByUserId = %s AND a.TimeStored >= DATE_SUB(CURDATE(), INTERVAL %s DAY) AND a.ProjectId is not null;
        """
        uploaded_files = fetch_data(uploaded_files_query, conn, params=(user_id, time_range)).to_dict(orient='records')

        # Attributes filled count
        attributes_filled_count_query = """
            SELECT COUNT(*) AS attributes_filled_count
            FROM cleantranscrm.ProjectAttributeValue pav
            LEFT JOIN cleantranscrm.`User` u on u.ProperName = pav.UpdatedBy 
            WHERE u.UserId = %s AND pav.UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        attributes_filled_count = int(fetch_data(attributes_filled_count_query, conn, params=(user_id, time_range)).iloc[0]['attributes_filled_count'])

        # Attributes filled details
        attributes_filled_query = """
            SELECT pav.id, pav.ProjectId , pav.ProgramAttributeId , pav.UpdatedAt , pav.UpdatedBy
				, CASE 
                    WHEN pa.ControlType = 'select' THEN so.OptionText
                ELSE pav.Value END AS 'Value', u.UserId , COALESCE(pp.PhaseId,0) AS 'PhaseId', pa.Label, pp.Name as 'PhaseName', p.ProjectId,  p.ProjectNumber, p.Name as 'ProjectName', o.Name as 'OrgName'
            FROM cleantranscrm.ProjectAttributeValue pav
            LEFT JOIN cleantranscrm.ProgramAttribute pa on pa.ProgramAttributeId = pav.ProgramAttributeId 
            LEFT JOIN cleantranscrm.`User` u on u.ProperName = pav.UpdatedBy
            LEFT JOIN cleantranscrm.Project p on p.ProjectId = pav.ProjectId 
            LEFT JOIN cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.ProgramPhase pp on pp.PhaseId = pa.PhaseId and pp.ProgramId = pa.ProgramId 
            LEFT JOIN cleantranscrm.SelectControl sc on sc.SelectControlId = pa.Source 
            LEFT JOIN cleantranscrm.SelectOption so on so.SelectControlId = sc.SelectControlId and so.OptionValue = pav.Value 
            WHERE u.UserId = %s AND pav.UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        attributes_filled = fetch_data(attributes_filled_query, conn, params=(user_id, time_range)).to_dict(orient='records')

        # Project table values count
        project_table_values_count_query = """
            SELECT COUNT(*) AS project_table_values_count
            FROM cleantranscrm.ProjectTableValue ptv
            WHERE (ptv.UpdatedBy = %s OR ptv.UpdatedBy = (SELECT ProperName FROM cleantranscrm.`User` u WHERE u.UserId = %s)) AND UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        project_table_values_count = int(fetch_data(project_table_values_count_query, conn, params=(user_id, user_id, time_range)).iloc[0]['project_table_values_count'])

        # Project table values
        project_table_values_query = """
            SELECT t.Name as 'TableName', tc.Label , tc.Description , tc.SortOrder, t.TableId, tc.TableColumnId
                , CASE 
                    WHEN tc.ControlType = 'select' THEN so.OptionText
                ELSE ptv.Value END AS 'Value'
                , ptv.`Row`
                , ptv.UpdatedAt 
                , ptv.UpdatedBy
                , p.ProjectId
                ,  p.ProjectNumber
                , p.Name as 'ProjectName'
                , o.Name as 'OrgName' 
            FROM cleantranscrm.ProjectTableValue ptv
            LEFT JOIN cleantranscrm.`Table` t on t.TableId = ptv.TableId 
            LEFT JOIN cleantranscrm.TableColumn tc on tc.TableColumnId = ptv.TableColumnId 
            LEFT JOIN cleantranscrm.Project p on p.ProjectId = ptv.ProjectId 
            LEFT JOIN cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.SelectControl sc on sc.SelectControlId = tc.Source 
            LEFT JOIN cleantranscrm.SelectOption so on so.SelectControlId = sc.SelectControlId and so.OptionValue = ptv.Value 
            WHERE (ptv.UpdatedBy = %s OR ptv.UpdatedBy = (SELECT ProperName FROM cleantranscrm.`User` u WHERE u.UserId = %s))
            AND ptv.UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        project_table_values = fetch_data(project_table_values_query, conn, params=(user_id, user_id, time_range)).to_dict(orient='records')

        # User saved filters
        user_saved_filters_query = """
            SELECT *
            FROM cleantranscrm.SavedFilter sf 
            WHERE UserId = %s;
        """
        user_saved_filters = fetch_data(user_saved_filters_query, conn, params=(user_id)).to_dict(orient='records')

        # User favorited projects
        user_favorited_projects_query = """
            select fp.*, p.ProjectNumber, o.Name as 'OrgName' from cleantranscrm.FavoriteProject fp
            left join cleantranscrm.Project p on p.ProjectId = fp.ProjectId 
            left join cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            WHERE fp.UserId = %s
        """
        user_favorited_projects = fetch_data(user_favorited_projects_query, conn, params=(user_id)).to_dict(orient='records')

        cursor = conn.cursor()
        cursor.execute("SELECT ProperName FROM cleantranscrm.`User` WHERE UserId = %s", (user_id,))
        proper_name = cursor.fetchone()[0]
        like_pattern = f"%@{proper_name}%"

         # Activity count
        user_mentions_count_query = """
            SELECT COUNT(*) AS user_mention_count
            FROM cleantranscrm.Activity a
            LEFT JOIN cleantranscrm.ActivityType at2 ON at2.ActivityTypeId = a.ActivityTypeId
            LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId
            LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = a.PhaseId AND pp.ProgramId = a.ProgramId
            LEFT JOIN cleantranscrm.`User` u on u.UserId = a.UserId 
            WHERE a.`Text` LIKE %s
            AND a.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        user_mention_count = int(fetch_data(user_mentions_count_query, conn, params=(like_pattern, time_range)).iloc[0]['user_mention_count'])

        # User mentions query
        user_mentions_query = """
            SELECT a.UserId, u.ProperName, a.`Text`, a.CreatedAt, at2.Name as 'ActivityType', a.Duration, pp.Name as 'PhaseName', 
                   p.ProjectNumber, p.Name as 'ProjectName', o.Name as 'OrgName'
            FROM cleantranscrm.Activity a
            LEFT JOIN cleantranscrm.ActivityType at2 ON at2.ActivityTypeId = a.ActivityTypeId
            LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId
            LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = a.PhaseId AND pp.ProgramId = a.ProgramId
            LEFT JOIN cleantranscrm.`User` u ON u.UserId = a.UserId
            WHERE a.`Text` LIKE %s
            AND a.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        user_mentions = fetch_data(user_mentions_query, conn, params=(like_pattern, time_range)).to_dict(orient='records')

        stats = {
            "activity_count": activity_count,
            "activity_logs": activity_logs,
            "uploaded_files_count": uploaded_files_count,
            "uploaded_files": uploaded_files,
            "attributes_filled_count": attributes_filled_count,
            "attributes_filled": attributes_filled,
            "project_table_values_count": project_table_values_count,
            "project_table_values": project_table_values,
            "user_saved_filters": user_saved_filters,
            "user_favorited_projects": user_favorited_projects,
            "user_mention_count": user_mention_count,
            "user_mentions": user_mentions
        }

        return jsonify({"stats": stats})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if conn:
            conn.close()

@app.route('/api/project-overview', methods=['GET'])
def get_overview():
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify({'error': 'Missing project_id parameter'}), 400

    try:
        conn = get_connection()
        # Attributes filled details
        project_info_query = """
            SELECT COALESCE(pp.PhaseId,0) AS 'PhaseId', pp.Name as 'PhaseName', p.ProjectId,  p.ProjectNumber, p.Name as 'ProjectName', o.Name as 'OrgName', pi.Name as 'ProgramName', ps.LongName AS ProjectStatus, u.ProperName as 'ProjectLead', p.CreatedAt as 'ProjectCreationDate'
            FROM cleantranscrm.Project p
            LEFT JOIN cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.Program pi on pi.ProgramId = p.ProgramId
            LEFT JOIN cleantranscrm.ProgramPhase pp on pp.PhaseId = p.CurrentPhaseId and pp.ProgramId = p.ProgramId
            LEFT JOIN cleantranscrm.ProjectRole pr on pr.ProjectId = p.ProjectId
            LEFT JOIN cleantranscrm.`User` u on u.UserId = pr.UserId
            JOIN cleantranscrm.ProjectStatus ps on ps.ProjectStatusId = p.Status
            WHERE pr.RoleId = 1 AND p.ProjectId = %s;
        """
        project_info = fetch_data(project_info_query, conn, params=(project_id)).to_dict(orient='records')

        project_overview_query = """
            SELECT 
                pn.PhaseId,
                pn.PhaseName,
                pn.SortOrder,
                pa.PromotionDate,
                pa.PromotedByUser AS PromotedByUser,
                CASE 
                    WHEN pa.PhaseId = pi.CurrentPhaseId THEN NULL
                    ELSE LEAD(pa.PromotionDate) OVER (PARTITION BY pa.ProjectId ORDER BY pa.PromotionDate)
                END AS NextPromotionDate,
                CASE 
                    WHEN pa.PhaseId = pi.CurrentPhaseId THEN DATEDIFF(CURDATE(), pa.PromotionDate)
                    ELSE DATEDIFF(COALESCE(LEAD(pa.PromotionDate) OVER (PARTITION BY pa.ProjectId ORDER BY pa.PromotionDate), CURDATE()), pa.PromotionDate)
                END AS DaysInPhase,
                pa.ActionType,
                    CASE 
                        WHEN pn.SortOrder = (
                            SELECT MAX(pp.SortOrder)
                            FROM cleantranscrm.ProgramPhase pp
                            WHERE pp.ProgramId = pn.ProgramId
                        ) THEN 1
                    ELSE 0
                END AS FinalPhase,
                CASE 
                    WHEN pa.PhaseOrder = 1 THEN DATEDIFF(pa.PromotionDate, pi.CreatedAt)
                    ELSE 0
                END AS DaysBeforeFirstPromotion
            FROM 
                (SELECT 
                    p.ProjectId,
                    p.ProjectNumber,
                    p.Name,
                    p.CurrentPhaseId,
                    p.Status,
                    p.AddressId,
                    p.OrganizationId,
                    p.ProgramId,
                    p.CreatedAt
                FROM cleantranscrm.Project p) pi
                JOIN (SELECT 
                    a.ProjectId,
                    a.PhaseId,
                    a.CreatedAt AS PromotionDate,
                    SUBSTRING_INDEX(SUBSTRING_INDEX(a.Text, ' this project', 1), '>', -1) AS PromotedByUser,
                    CASE 
                        WHEN a.Text LIKE '%%promoted this project%%' THEN 'Promotion'
                        WHEN a.Text LIKE '%%demoted this project%%' THEN 'Demotion'
                    END AS ActionType,
                    ROW_NUMBER() OVER (PARTITION BY a.ProjectId ORDER BY a.CreatedAt) AS PhaseOrder
                FROM cleantranscrm.Activity a
                WHERE a.Text LIKE '%%promoted this project%%' OR a.Text LIKE '%%demoted this project%%') pa ON pi.ProjectId = pa.ProjectId
                JOIN (SELECT 
                    pp.ProgramId,
                    pp.PhaseId,
                    pp.Name AS PhaseName,
                    pp.SortOrder
                FROM cleantranscrm.ProgramPhase pp
                ) pn ON pa.PhaseId = pn.PhaseId AND pi.ProgramId = pn.ProgramId
                JOIN cleantranscrm.ProjectStatus ps on ps.ProjectStatusId = pi.status
                JOIN cleantranscrm.Program p on p.ProgramId = pi.ProgramId
            WHERE pi.ProjectId = %s
            ORDER BY 
                pi.ProjectId, pa.PromotionDate;
        """
        project_overview = fetch_data(project_overview_query, conn, params=(project_id,)).to_dict(orient='records')
        # Handle NaT values in the result
        for record in project_overview:
            if pd.isnull(record['NextPromotionDate']):
                record['NextPromotionDate'] = None

        overview = {
            "project_info": project_info,
            "promotion": project_overview
        }

        return jsonify({"overview": overview})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if conn:
            conn.close()


@app.route('/api/project-phase', methods=['GET'])
def get_project_phase():
    program_id = request.args.get('program_id')
    project_status = request.args.get('project_status')
    conn = None
    cursor = None

    query = """
    WITH PhaseTransitions AS (
        SELECT 
            pa.ProjectId,
            pn.PhaseId,
            pn.PhaseName,
            pn.SortOrder,
            pa.PromotionDate,
            CASE 
                WHEN pa.PhaseId = pi.CurrentPhaseId THEN NULL
                ELSE LEAD(pa.PromotionDate) OVER (PARTITION BY pa.ProjectId ORDER BY pa.PromotionDate)
            END AS NextPromotionDate,
            pi.ProgramId,
            pi.Status,
            u.ProperName as 'ProjectLead'
        FROM 
            (SELECT 
                p.ProjectId,
                p.CurrentPhaseId,
                p.ProgramId,
                p.Status,
                p.Deleted
            FROM cleantranscrm.Project p) pi
            JOIN (SELECT 
                a.ProjectId,
                a.PhaseId,
                a.CreatedAt AS PromotionDate
            FROM cleantranscrm.Activity a
            WHERE a.Text LIKE '%%promoted this project%%' OR a.Text LIKE '%%demoted this project%%') pa ON pi.ProjectId = pa.ProjectId
            JOIN (SELECT 
                pp.PhaseId,
                pp.Name AS PhaseName,
                pp.ProgramId,
                pp.SortOrder
            FROM cleantranscrm.ProgramPhase pp) pn ON pa.PhaseId = pn.PhaseId and pi.ProgramId = pn.Programid
        LEFT JOIN cleantranscrm.ProjectRole pr on pr.ProjectId = pa.ProjectId
        LEFT JOIN cleantranscrm.`User` u on u.UserId = pr.UserId 
        WHERE pi.Deleted = 0
    ),
    TimeIncrements AS (
        SELECT 
            DATE_ADD('2020-01-01', INTERVAL (n * 14) DAY) AS StartDate,
            DATE_ADD('2020-01-01', INTERVAL ((n + 1) * 14) DAY) AS EndDate
        FROM (
            SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40 UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45 UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50 UNION ALL SELECT 51 UNION ALL SELECT 52 UNION ALL SELECT 53 UNION ALL SELECT 54 UNION ALL SELECT 55 UNION ALL SELECT 56 UNION ALL SELECT 57 UNION ALL SELECT 58 UNION ALL SELECT 59 UNION ALL SELECT 60 UNION ALL SELECT 61 UNION ALL SELECT 62 UNION ALL SELECT 63 UNION ALL SELECT 64 UNION ALL SELECT 65 UNION ALL SELECT 66 UNION ALL SELECT 67 UNION ALL SELECT 68 UNION ALL SELECT 69 UNION ALL SELECT 70 UNION ALL SELECT 71 UNION ALL SELECT 72 UNION ALL SELECT 73 UNION ALL SELECT 74 UNION ALL SELECT 75 UNION ALL SELECT 76 UNION ALL SELECT 77 UNION ALL SELECT 78 UNION ALL SELECT 79 UNION ALL SELECT 80 UNION ALL SELECT 81 UNION ALL SELECT 82 UNION ALL SELECT 83 UNION ALL SELECT 84 UNION ALL SELECT 85 UNION ALL SELECT 86 UNION ALL SELECT 87 UNION ALL SELECT 88 UNION ALL SELECT 89 UNION ALL SELECT 90 UNION ALL SELECT 91 UNION ALL SELECT 92 UNION ALL SELECT 93 UNION ALL SELECT 94 UNION ALL SELECT 95 UNION ALL SELECT 96 UNION ALL SELECT 97 UNION ALL SELECT 98 UNION ALL SELECT 99 UNION ALL SELECT 100 UNION ALL SELECT 101 UNION ALL SELECT 102 UNION ALL SELECT 103 UNION ALL SELECT 104 UNION ALL SELECT 105 UNION ALL SELECT 106 UNION ALL SELECT 107 UNION ALL SELECT 108 UNION ALL SELECT 109 UNION ALL SELECT 110 UNION ALL SELECT 111 UNION ALL SELECT 112 UNION ALL SELECT 113 UNION ALL SELECT 114 UNION ALL SELECT 115 UNION ALL SELECT 116 UNION ALL SELECT 117 UNION ALL SELECT 118 UNION ALL SELECT 119 UNION ALL SELECT 120 UNION ALL SELECT 121 UNION ALL SELECT 122 UNION ALL SELECT 123 UNION ALL SELECT 124 UNION ALL SELECT 125 UNION ALL SELECT 126 UNION ALL SELECT 127 UNION ALL SELECT 128 UNION ALL SELECT 129 UNION ALL SELECT 130 UNION ALL SELECT 131 UNION ALL SELECT 132 UNION ALL SELECT 133 UNION ALL SELECT 134 
        ) numbers
    )
    SELECT 
        ti.StartDate,
        ti.EndDate,
        pt.ProgramId,
        pt.PhaseName,
        COUNT(DISTINCT pt.ProjectId) AS ProjectCount,
        pt.ProjectLead
    FROM 
        TimeIncrements ti
        LEFT JOIN PhaseTransitions pt ON pt.PromotionDate < ti.EndDate AND (pt.NextPromotionDate IS NULL OR pt.NextPromotionDate >= ti.StartDate)
    WHERE 
        (%s IS NULL OR pt.ProgramId = %s) AND
        (%s IS NULL OR pt.Status = %s)
    GROUP BY 
        ti.StartDate, ti.EndDate, pt.ProgramId, pt.PhaseName
    ORDER BY 
        ti.StartDate, pt.ProgramId, pt.SortOrder;
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(query, (program_id, program_id, project_status, project_status))
        
        # Fetch column names
        columns = [desc[0] for desc in cursor.description]
        
        # Fetch all rows and convert to list of dictionaries
        rows = cursor.fetchall()
        results = []
        for row in rows:
            result_dict = {}
            for i, value in enumerate(row):
                # Convert datetime objects to string format
                if isinstance(value, (datetime.date, datetime.datetime)):
                    value = value.isoformat()
                result_dict[columns[i]] = value
            results.append(result_dict)
        
        return jsonify(results)
        
    except Exception as e:
        print("Error:", e)  # Log the error
        return jsonify({'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            try:
                conn.close()
            except Exception:
                pass  # Ignore errors when closing an already-closed connection

@app.route('/api/phase-transitions', methods=['GET'])
def get_phase_transitions():
    program_id = request.args.get('program_id')
    project_status = request.args.get('project_status')
    
    query = """
    WITH PhaseTransitions AS (
        SELECT 
            p.ProjectId,
            p.ProjectNumber,
            a.PhaseId,
            pp.Name as PhaseName,
            pp.SortOrder,
            a.CreatedAt as TransitionDate,
            LEAD(a.CreatedAt) OVER (PARTITION BY p.ProjectId ORDER BY a.CreatedAt) as NextTransitionDate,
            p.ProgramId,
            p.Status
        FROM cleantranscrm.Project p
        JOIN cleantranscrm.Activity a ON a.ProjectId = p.ProjectId
        JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = a.PhaseId AND pp.ProgramId = p.ProgramId
        WHERE (a.Text LIKE '%%promoted this project%%' OR a.Text LIKE '%%demoted this project%%')
        AND p.Deleted = 0
        AND (%s IS NULL OR p.ProgramId = %s)
        AND (%s IS NULL OR p.Status = %s)
    ),
    PhaseDurations AS (
        SELECT 
            PhaseId,
            TIMESTAMPDIFF(DAY, TransitionDate, COALESCE(NextTransitionDate, NOW())) as DaysInPhase
        FROM PhaseTransitions
    ),
    MedianCalculation AS (
        SELECT 
            PhaseId,
            DaysInPhase,
            ROW_NUMBER() OVER (PARTITION BY PhaseId ORDER BY DaysInPhase) as RowAsc,
            ROW_NUMBER() OVER (PARTITION BY PhaseId ORDER BY DaysInPhase DESC) as RowDesc
        FROM PhaseDurations
    )
    SELECT 
        pt.PhaseId,
        pt.PhaseName,
        pt.SortOrder,
        COUNT(DISTINCT pt.ProjectId) as ProjectCount,
        AVG(pd.DaysInPhase) as AvgDaysInPhase,
        MIN(pd.DaysInPhase) as MinDaysInPhase,
        MAX(pd.DaysInPhase) as MaxDaysInPhase,
        AVG(mc.DaysInPhase) as MedDaysInPhase
    FROM PhaseTransitions pt
    JOIN PhaseDurations pd ON pt.PhaseId = pd.PhaseId
    JOIN MedianCalculation mc ON mc.PhaseId = pt.PhaseId
    WHERE mc.RowAsc = mc.RowDesc OR mc.RowAsc + 1 = mc.RowDesc
    GROUP BY pt.PhaseId, pt.PhaseName, pt.SortOrder
    ORDER BY pt.SortOrder;
    """
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(query, (program_id, program_id, project_status, project_status))
        
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        results = []
        for row in rows:
            result_dict = {}
            for i, value in enumerate(row):
                result_dict[columns[i]] = value
            results.append(result_dict)
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Optional: Add a health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return {"status": "healthy"}

# Enable CORS
CORS(app, resources={r"/graphql": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)