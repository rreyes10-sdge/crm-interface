from flask import Flask, jsonify, request, render_template_string, abort
from ariadne import QueryType, graphql_sync, make_executable_schema
from graphql_app.resolvers import Resolvers  
from flask_cors import CORS
from graphql_app.schema import type_defs
from .db_logic import get_connection, fetch_data, format_dates, get_project_service_attributes, get_project_milestone_dates, get_current_phase_attributes
import pandas as pd
from .queries import QUERIES
from werkzeug.exceptions import HTTPException
from datetime import datetime, timedelta
from collections import Counter
from src.app.data.static_data import fossil_fuel_mpg_mapping, TOU_DATA
import json
import calendar
import math
from datetime import datetime, date, timedelta



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
            	DISTINCT(p.ProjectId), p.ProjectNumber , p.Name as 'ProjectName', ps.LongName as 'ProjectStatus', p2.Name as 'ProgramName', o.Name as 'OrgName', u.ProperName as 'ProjectLead', pp.Name as 'PhaseName', COALESCE(TIMESTAMPDIFF(DAY, A.CreatedAt, NOW()),0) as 'DaysInPhase'
            from cleantranscrm.Project p 
            left join cleantranscrm.ProjectStatus ps on ps.ProjectStatusId = p.Status 
            left join cleantranscrm.Program p2 on p2.ProgramId = p.ProgramId 
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = p.CurrentPhaseId and pp.ProgramId = p.ProgramId 
            left JOIN cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            left join cleantranscrm.ProjectRole pr on pr.ProjectId = p.ProjectId 
            left join cleantranscrm.`Role` r on r.RoleId = pr.RoleId 
            left join cleantranscrm.`User` u on u.UserId = pr.UserId 
            LEFT JOIN (
                SELECT a.*
                FROM cleantranscrm.Activity a
                WHERE (a.Text LIKE '%%promoted this project%%' OR a.Text LIKE '%%demoted this project%%')
                AND a.PhaseId = (SELECT MAX(a2.PhaseId) FROM cleantranscrm.Activity a2 WHERE a2.ProjectId = a.ProjectId)
            ) A ON A.ProjectId = p.ProjectId
            where p.Deleted = 0 and pr.RoleId = 1
            GROUP BY p.ProjectId, p.ProjectNumber, p.Name, ps.LongName, p2.Name, o.Name, u.ProperName, pp.Name, A.PhaseId;
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

@app.route('/api/data/current-phase-attributes', methods=['GET'])
def current_phase_attributes():
    projectId = request.args.get('projectId')
    if not projectId:
        return jsonify({'error': 'Missing projectId'}), 400
    try:
        connection = get_connection()
        data = get_current_phase_attributes(connection, projectId)
        date_columns = ['UpdatedAt']
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

def determine_season(year: int, month: int, tou_seasons: dict) -> str:
    # Parse season date ranges
    summer_start = date(year, 6, 1)
    summer_end = date(year, 10, 31)
    current_date = date(year, month, 15)  # use middle of the month to avoid day issues
 
    if summer_start <= current_date <= summer_end:
        return "Summer"
    else:
        return "Winter"
    
def parse_time_str(time_str):
    return datetime.strptime(time_str, "%H:%M").time()
 
def get_tou_segments_for_day_type(tou_data, day_type, season):
    segments = {}
    for category, time_ranges in tou_data["TOU"][day_type][season].items():
        if isinstance(time_ranges, list):
            # Convert ["06:00-16:00", "21:00-00:00"] to tuples
            segments[category] = [tuple(tr.split('-')) for tr in time_ranges]
        else:
            # Single range like "16:00-21:00"
            segments[category] = [tuple(time_ranges.split('-'))]
    return segments

def time_to_datetime(t):
    return datetime.strptime(t, "%H:%M")

def get_day_type(day_name):
    return "WeekendsAndHolidays" if day_name in ["Saturday", "Sunday"] else "Weekdays"

def get_tou_hours(start_time_str, end_time_str, season, day_type, tou_data, tdven, charger_kw, allowed_periods):
    # Parse start and end times as datetime
    start_dt = time_to_datetime(start_time_str)
    end_dt = time_to_datetime(end_time_str)
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)  # handle wraparound to next day

    total_hours = {
        "On-Peak": 0,
        "Off-Peak": 0,
        "Super Off-Peak": 0
    }

    segments = get_tou_segments_for_day_type(tou_data, day_type, season)
    remaining_energy = tdven

    # Iterate over each hour in the time range
    current = start_dt
    while current < end_dt and remaining_energy > 0:
        next_hour = current + timedelta(hours=1)
        current_time = current.time()

        for category, time_ranges in segments.items():
            if category not in allowed_periods:
                continue
            for start, end in time_ranges:
                start_seg = time_to_datetime(start)
                end_seg = time_to_datetime(end)
                if end_seg <= start_seg:
                    end_seg += timedelta(days=1)

                if start_seg.time() <= current_time < end_seg.time() or \
                   (start_seg <= current < end_seg):
                    total_hours[category] += 1
                    remaining_energy -= charger_kw
                    break
        current = next_hour

    return total_hours

# charging_behavior_start_time = data.get("charging_behavior", {}).get("startTime", "21:00")
# charging_behavior_end_time = data.get("charging_behavior", {}).get("endTime", "05:59")

def get_total_tou_hours_for_day(data, day, season, tou_data, tdven, charger_kw, allowed_periods):
    day_type = get_day_type(day)
    return get_tou_hours(
        start_time_str=data.get("charging_behavior", {}).get("startTime", "21:00"),
        end_time_str=data.get("charging_behavior", {}).get("endTime", "05:59"),
        season=season,
        day_type=day_type,
        tou_data=tou_data,
        tdven=tdven,
        charger_kw=charger_kw,
        allowed_periods=allowed_periods
    )


def generate_days_in_month(year, month):
    num_days = calendar.monthrange(year, month)[1]
    return [date(year, month, day).strftime("%A") for day in range(1, num_days + 1)]

def calculate_tou_hours_with_cutoff(tdven, charger_kw, tou_hours, allowed_periods):
    total_hours = {"On-Peak": 0, "Off-Peak": 0, "Super Off-Peak": 0}
    remaining_energy = tdven

    for period in allowed_periods:
        if remaining_energy <= 0:
            break
        hours = tou_hours[period]
        energy_needed = hours * charger_kw
        if remaining_energy <= energy_needed:
            total_hours[period] += remaining_energy / charger_kw
            remaining_energy = 0
        else:
            total_hours[period] += hours
            remaining_energy -= energy_needed

    return total_hours


def get_total_tou_hours_for_period(data, year, month, tou_data, scenario, tdven, charger_kw):
    season = determine_season(year, month, tou_data["Seasons"])
    all_days_in_month = generate_days_in_month(year, month)
    selected_days = data['charging_behavior']['days']

    active_days = [
        day for day in all_days_in_month
        if day[:3].upper() in selected_days
    ]

    total_tou_hours = {"On-Peak": 0, "Off-Peak": 0, "Super Off-Peak": 0}
    
    for day in active_days:
        if scenario == "scenario_2" or scenario == "scenario_4":
            allowed_periods = ["Off-Peak", "Super Off-Peak"]
        else:
            allowed_periods = ["On-Peak", "Off-Peak", "Super Off-Peak"]

        daily_tou_hours = get_total_tou_hours_for_day(data, day, season, tou_data, tdven, charger_kw, allowed_periods)
        total_tou_hours["On-Peak"] += daily_tou_hours["On-Peak"]
        total_tou_hours["Off-Peak"] += daily_tou_hours["Off-Peak"]
        total_tou_hours["Super Off-Peak"] += daily_tou_hours["Super Off-Peak"]
    
    return total_tou_hours

def service_fee(power_requirement, year):
    year_data = TOU_DATA["TOU_Rates"].get(str(year), {})
    service_fee_data = year_data.get("ServiceFee", {'ServiceFeeLess': 213.30, 'ServiceFeeMore': 766.91})
    
    if power_requirement <= 500:
        return service_fee_data['ServiceFeeLess']
    else:
        return service_fee_data['ServiceFeeMore']
    
def subscription_fee(power_requirement, year):
    year_data = TOU_DATA["TOU_Rates"].get(str(year), {})
    subscription_fee_data = year_data.get("SubscriptionFee", {'SubscriptionFeeLess': 48.33, 'SubscriptionFeeMore': 120.85})
    
    if power_requirement <= 150:
        fee = subscription_fee_data['SubscriptionFeeLess'] * (power_requirement / 10)
    else:
        fee = subscription_fee_data['SubscriptionFeeMore'] * (power_requirement / 25)
    
    # Round up to the nearest cent
    fee = math.ceil(fee * 100) / 100
    return fee

    
def calculate_commodity_distribution_cost(power_requirement, tou_hours, season, year, day_type, tou_data):
    # if tou_hours is None or (tou_hours["Off-Peak"] == 0 and tou_hours["Super Off-Peak"] == 0):
    #     return "N/A"
    rates = tou_data["TOU_Rates"][str(year)][day_type][season]
    cost = (
        power_requirement * tou_hours["On-Peak"] * rates["On-Peak"]["Total"] +
        power_requirement * tou_hours["Off-Peak"] * rates["Off-Peak"]["Total"] +
        power_requirement * tou_hours["Super Off-Peak"] * rates["Super_Off-Peak"]["Total"]
    )
    return cost


@app.route('/calculate_v2', methods=['POST'])
def calculate_v2():
    data = request.json

    # Create a list of year/month combinations from 2025 to 2032
    year_month_combinations = [{"year": year, "month": month} for year in range(2025, 2033) for month in range(1, 13)]

    general_info = {}
    monthly_results = []

    for combination in year_month_combinations:
        year = combination["year"]
        month = combination["month"]

        # Determine TOU season using helper
        season = determine_season(year, month, TOU_DATA["Seasons"])

        # Perform calculations (you can call your existing functions here)
        result = process_row(data, year, month, season)

        # Extract general information once
        if not general_info:
            general_info = {
                "total_vehicles": result["total_vehicles"],
                "total_daily_miles_driven": result["total_daily_miles_driven"],
                "total_chargers": result["total_chargers"],
                "TDVEN": result["TDVEN"],
                "fossil_fuel_average_mpg": result["fossil_fuel_average_mpg"],
                "first_active_daily_tou_hours": result["first_active_daily_tou_hours"],
                "error_checks": result["error_checks"]
            }

        # Append monthly results
        monthly_results.append({
            "year": year,
            "month": month,
            "charging_days_count": result["charging_days_count"],
            "tou_season": result["tou_season"],
            # "total_daily_charger_energy_output_with_onpeak": result["total_daily_charger_energy_output_with_onpeak"],
            # "total_daily_charger_energy_output_without_onpeak": result["total_daily_charger_energy_output_without_onpeak"],
            "total_month_tou_hours": result["total_month_tou_hours"],
            "scenario_1": result["scenario_1"],
            "scenario_2": result["scenario_2"],
            "scenario_3": result["scenario_3"],
            "scenario_4": result["scenario_4"],
            "adjusted_fossil_fuel_price": result["adjusted_fossil_fuel_price"],
            "monthly_fossil_fuel_tc": result["monthly_fossil_fuel_tc"]
        })

    averages_and_savings = calculate_averages_and_savings(monthly_results)
    yearly_costs = calculate_total_costs_per_year(monthly_results)

    return jsonify({
        "general_info": general_info,
        "monthly_results": monthly_results,
        "averages_and_savings": averages_and_savings,
        "yearly_costs": yearly_costs
    })

def calculate_total_costs_per_year(monthly_results):
    yearly_costs = {}

    for result in monthly_results:
        year = result["year"]
        electric_monthly_tc = result["scenario_1"]["electric_monthly_tc"]
        fossil_fuel_monthly_tc = result["monthly_fossil_fuel_tc"]

        if year not in yearly_costs:
            yearly_costs[year] = {
                "total_electric_tc": 0,
                "total_fossil_fuel_tc": 0
            }
        
        yearly_costs[year]["total_electric_tc"] += electric_monthly_tc
        yearly_costs[year]["total_fossil_fuel_tc"] += fossil_fuel_monthly_tc

    return yearly_costs

def calculate_averages_and_savings(monthly_results):
    total_electric_monthly_tc = 0
    total_fossil_fuel_monthly_tc = 0
    num_months = len(monthly_results)

    for result in monthly_results:
        total_electric_monthly_tc += result["scenario_1"]["electric_monthly_tc"]
        total_fossil_fuel_monthly_tc += result["monthly_fossil_fuel_tc"]

    average_electric_monthly_tc = total_electric_monthly_tc / num_months
    average_fossil_fuel_monthly_tc = total_fossil_fuel_monthly_tc / num_months
    monthly_savings = average_fossil_fuel_monthly_tc - average_electric_monthly_tc

    yearly_electric_tc = average_electric_monthly_tc * 12
    yearly_fossil_fuel_tc = average_fossil_fuel_monthly_tc * 12
    yearly_savings = yearly_fossil_fuel_tc - yearly_electric_tc

    return {
        "average_electric_monthly_tc": average_electric_monthly_tc,
        "average_fossil_fuel_monthly_tc": average_fossil_fuel_monthly_tc,
        "monthly_savings": monthly_savings,
        "yearly_electric_tc": yearly_electric_tc,
        "yearly_fossil_fuel_tc": yearly_fossil_fuel_tc,
        "yearly_savings": yearly_savings
    }


def process_row(data, year, month, season):
    # Determine TOU season using helper
    season = determine_season(year, month, TOU_DATA["Seasons"])

    total_daily_miles_driven = 0
    total_num_vehicles = 0

    vehicle_groups = []
    for i in range(1, 6):
        vehicle_class = data.get(f"vehicle_group_{i}_class")
        num_vehicles = int(data.get(f"vehicle_group_{i}_num") or 0)
        avg_daily_mileage = int(data.get(f"vehicle_group_{i}_mileage") or 0)
        if vehicle_class and num_vehicles > 0:
            vehicle_groups.append({
                "vehicle_class": vehicle_class,
                "num_vehicles": num_vehicles,
                "avg_daily_mileage": avg_daily_mileage
            })
            total_num_vehicles += num_vehicles
            total_daily_miles_driven += avg_daily_mileage * num_vehicles
 
    charger_groups = []
    for i in range(1, 6):
        num_chargers = int(data.get(f"charger_group_{i}_num") or 0)
        charger_kw = int(data.get(f"charger_group_{i}_kw") or 0)
        if num_chargers > 0:
            charger_groups.append({
                "num_chargers": num_chargers,
                "charger_kw": charger_kw
            })

    total_num_chargers = 0
    total_charger_capacity = 0

    for i in range(1, 6):
        num_chargers = int(data.get(f"charger_group_{i}_num") or 0)
        charger_kw = int(data.get(f"charger_group_{i}_kw") or 0)
        if num_chargers > 0:
            charger_groups.append({
                "num_chargers": num_chargers,
                "charger_kw": charger_kw
            })
            total_num_chargers += num_chargers
            total_charger_capacity += num_chargers * charger_kw
    base_year = 2025
    # Calculate the number of years since the base year
    years_since_base = year - base_year

    fossil_fuel_price = float(data.get("fossil_fuel_price", 4.30) or 4.30)
    fossil_fuel_multiplier = float(data.get("fossil_fuel_multiplier", 1.0131) or 1.0131)
    fossil_fuel_mpg_override = data.get("fossil_fuel_efficiency")
    transformer_capacity = float(data.get("transformer_capacity", 0) or 0)

    adjusted_fossil_fuel_price = fossil_fuel_price * ((fossil_fuel_multiplier) ** years_since_base)


    # Parse the charging_behavior_days field
    if 'charging_behavior_days' in data and data['charging_behavior_days']:
        try:
            data['charging_behavior_days'] = json.loads(data['charging_behavior_days'])
        except json.JSONDecodeError:
            data['charging_behavior_days'] = {}

    # all_days_in_month = generate_days_in_month(year, month)
    # active_days = [
    #     day for day in all_days_in_month
    #     if str(data['charging_behavior_days'].get(day, 'false')).lower() in ['true', '1']
    # ]

    
    all_days_in_month = generate_days_in_month(year, month)
    selected_days = data['charging_behavior']['days']

    active_days = [
        day for day in all_days_in_month
        if day[:3].upper() in selected_days
    ]


    def count_days_in_month(year, month, active_days):
        day_name_to_index = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2,
            "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        c = calendar.Calendar()
        count = 0
        for day in c.itermonthdays2(year, month):
            day_num, weekday = day
            if day_num != 0 and weekday in [day_name_to_index[d] for d in active_days]:
                count += 1
        return count

    # Calculate TDVEN (Total Daily Vehicle Energy Needed)
    tdven = 0
    total_mpg = 0
    for group in vehicle_groups:
        vehicle_class = group["vehicle_class"]
        num_vehicles = group["num_vehicles"]
        mileage = group["avg_daily_mileage"]
    
        efficiency_data = fossil_fuel_mpg_mapping.get(vehicle_class)
        if efficiency_data:
            miles_per_kwh = efficiency_data["mile_per_kwh"]
            tdven += num_vehicles * mileage / miles_per_kwh
            mpg = efficiency_data["mpg"]
            total_mpg += mpg * num_vehicles
        else:
            print(f"Warning: Efficiency data not found for vehicle class '{vehicle_class}'")

    if fossil_fuel_mpg_override:
        try:
            fossil_fuel_mpg_override = float(fossil_fuel_mpg_override)
            average_mpg = fossil_fuel_mpg_override
        except ValueError:
            print("Warning: Invalid fossil_fuel_efficiency value, using calculated average MPG")
            average_mpg = total_mpg / total_num_vehicles if total_num_vehicles > 0 else 15
    else:
        average_mpg = total_mpg / total_num_vehicles if total_num_vehicles > 0 else 15

    

    # print(tdven)
    # print(total_charger_capacity)

    # Calculate TOU hours for the first active day
    first_active_day = active_days[0] if active_days else None
    if first_active_day:
        first_day_tou_hours = get_total_tou_hours_for_day(data, first_active_day, season, TOU_DATA, tdven, charger_kw, ["On-Peak", "Off-Peak", "Super Off-Peak"])

    # Calculate total TOU hours for the entire month given each scenario
    total_tou_hours_scenario_1 = get_total_tou_hours_for_period(data, year, month, TOU_DATA, "scenario_1", tdven, charger_kw)
    total_tou_hours_scenario_2 = get_total_tou_hours_for_period(data, year, month, TOU_DATA, "scenario_2", tdven, charger_kw)
    total_tou_hours_scenario_3 = get_total_tou_hours_for_period(data, year, month, TOU_DATA, "scenario_3", tdven, total_charger_capacity)
    total_tou_hours_scenario_4 = get_total_tou_hours_for_period(data, year, month, TOU_DATA, "scenario_4", tdven, total_charger_capacity)

    # first day tou hours since we power requirement is measured hourly and the total tou hours sums total hours for full month. tdven is daily energy, thus we only calculate using tou hours for one day, in this case the first active day user specified
    power_requirements = {
        "scenario_1": tdven / (first_day_tou_hours["On-Peak"] + first_day_tou_hours["Off-Peak"] + first_day_tou_hours["Super Off-Peak"]) if total_tou_hours_scenario_1 and (first_day_tou_hours["On-Peak"] + first_day_tou_hours["Off-Peak"] + first_day_tou_hours["Super Off-Peak"]) != 0 else 0,
        "scenario_2": tdven / (first_day_tou_hours["Off-Peak"] + first_day_tou_hours["Super Off-Peak"]) if total_tou_hours_scenario_2 and (first_day_tou_hours["Off-Peak"] + first_day_tou_hours["Super Off-Peak"]) != 0 else 0,
        "scenario_3": total_charger_capacity,
        "scenario_4": total_charger_capacity
    }

    # Monthly EV Cost compilations start here
    # basic service fee
    fee = {
        "scenario_1": service_fee(power_requirements['scenario_1'], year),
        "scenario_2": service_fee(power_requirements['scenario_2'], year),
        "scenario_3": service_fee(power_requirements['scenario_3'], year),
        "scenario_4": service_fee(power_requirements['scenario_4'], year)
    }
    
    # subscription fee
    sub_fee = {
        "scenario_1": subscription_fee(power_requirements['scenario_1'], year) if power_requirements["scenario_1"] != "N/A" else "N/A",
        "scenario_2": subscription_fee(power_requirements['scenario_2'], year) if power_requirements["scenario_2"] != "N/A" else "N/A",
        "scenario_3": subscription_fee(power_requirements['scenario_3'], year),
        "scenario_4": subscription_fee(power_requirements['scenario_4'], year) if power_requirements["scenario_4"] != "N/A" else "N/A"
    }

    # commodity distribution costs
    commodity_distribution_cost = {
        "scenario_1": calculate_commodity_distribution_cost(power_requirements["scenario_1"], total_tou_hours_scenario_1, season, year, get_day_type(first_active_day), TOU_DATA) if power_requirements["scenario_1"] != "N/A" else "N/A",
        "scenario_2": calculate_commodity_distribution_cost(power_requirements["scenario_2"], total_tou_hours_scenario_2, season, year, get_day_type(first_active_day), TOU_DATA) if power_requirements["scenario_2"] != "N/A" and (total_tou_hours_scenario_2["Off-Peak"] != 0 or total_tou_hours_scenario_2["Super Off-Peak"] != 0) else "N/A",
        "scenario_3": calculate_commodity_distribution_cost(power_requirements["scenario_3"], total_tou_hours_scenario_3, season, year, get_day_type(first_active_day), TOU_DATA),
        "scenario_4": calculate_commodity_distribution_cost(power_requirements["scenario_4"], total_tou_hours_scenario_4, season, year, get_day_type(first_active_day), TOU_DATA) if power_requirements["scenario_4"] != "N/A" and (total_tou_hours_scenario_4["Off-Peak"] != 0 or total_tou_hours_scenario_4["Super Off-Peak"] != 0) else "N/A"
    }

    # tc = total cost = sum (service fee + sub fee + commodity distribution )
    electric_monthly_tc = {
        "scenario_1": fee["scenario_1"] + sub_fee["scenario_1"] + commodity_distribution_cost["scenario_1"] if fee["scenario_1"] != "N/A" and sub_fee["scenario_1"] != "N/A" and commodity_distribution_cost["scenario_1"] != "N/A" else "N/A",
        "scenario_2": fee["scenario_2"] + sub_fee["scenario_2"] + commodity_distribution_cost["scenario_2"] if fee["scenario_2"] != "N/A" and sub_fee["scenario_2"] != "N/A" and commodity_distribution_cost["scenario_2"] != "N/A" else "N/A",
        "scenario_3": fee["scenario_3"] + sub_fee["scenario_3"] + commodity_distribution_cost["scenario_3"] if fee["scenario_3"] != "N/A" and sub_fee["scenario_3"] != "N/A" and commodity_distribution_cost["scenario_3"] != "N/A" else "N/A",
        "scenario_4": fee["scenario_4"] + sub_fee["scenario_4"] + commodity_distribution_cost["scenario_4"] if fee["scenario_4"] != "N/A" and sub_fee["scenario_4"] != "N/A" and commodity_distribution_cost["scenario_4"] != "N/A" else "N/A"
    }

    # fossil fuel calculations
    total_monthly_miles_driven = total_daily_miles_driven * count_days_in_month(year,month,active_days)
    monthly_fossil_fuel_tc = (total_monthly_miles_driven / average_mpg) * adjusted_fossil_fuel_price

    # optional settings and miscellaneous calculations

    # charger coverage check flags per scenario
    # scenario 2 and 4 allow on-peak charging (unmanaged scenarios)
    # scenario 1 and 3 do not allow on-peak charging (optimal/managed scenarios)
    total_daily_charger_energy_output_with_onpeak = total_charger_capacity * (first_day_tou_hours["On-Peak"] + first_day_tou_hours["Off-Peak"] + first_day_tou_hours["Super Off-Peak"])
    total_daily_charger_energy_output_without_onpeak = total_charger_capacity * (first_day_tou_hours["Off-Peak"] + first_day_tou_hours["Super Off-Peak"])

    charger_cover_scenarios_2_and_4 = 'true' if total_daily_charger_energy_output_without_onpeak >= tdven else 'false'
    charger_cover_scenarios_1_and_3 = 'true' if total_daily_charger_energy_output_with_onpeak >= tdven else 'false'
    # print("tdven", tdven, "umanaged capacity", total_daily_charger_energy_output_with_onpeak, "managed capacity", total_daily_charger_energy_output_without_onpeak, "unamanged", charger_cover_scenarios_2_and_4, "managed", charger_cover_scenarios_1_and_3)
    
    available_transformer_capacity_check = 'true' if transformer_capacity > power_requirements["scenario_3"] else 'false'
    # print(transformer_capacity,power_requirements["scenario_3"],available_transformer_capacity_check)

    
    return {
        "total_vehicles": total_num_vehicles,
        "total_daily_miles_driven": total_daily_miles_driven,
        "total_chargers": total_num_chargers,
        "charging_days_count": count_days_in_month(year,month,active_days),
        "tou_season": season,
        "TDVEN": round(tdven, 2),
        "total_daily_charger_energy_output_with_onpeak": total_daily_charger_energy_output_with_onpeak,
        "total_daily_charger_energy_output_without_onpeak": total_daily_charger_energy_output_without_onpeak,
        "first_active_daily_tou_hours": first_day_tou_hours,
        "total_month_tou_hours": {
            "scenario_1": total_tou_hours_scenario_1,
            "scenario_2": total_tou_hours_scenario_2,
            "scenario_3": total_tou_hours_scenario_3,
            "scenario_4": total_tou_hours_scenario_4
        },
        "scenario_1": {"power_requirement": power_requirements["scenario_1"], "basic_service_fee": fee["scenario_1"], "subscription_fee": sub_fee["scenario_1"], "commodity_distribution_cost": commodity_distribution_cost["scenario_1"], "electric_monthly_tc": electric_monthly_tc["scenario_1"]},
        "scenario_2": {"power_requirement": power_requirements["scenario_2"], "basic_service_fee": fee["scenario_2"], "subscription_fee": sub_fee["scenario_2"], "commodity_distribution_cost": commodity_distribution_cost["scenario_2"], "electric_monthly_tc": electric_monthly_tc["scenario_2"]},
        "scenario_3": {"power_requirement": power_requirements["scenario_3"], "basic_service_fee": fee["scenario_3"], "subscription_fee": sub_fee["scenario_3"], "commodity_distribution_cost": commodity_distribution_cost["scenario_3"], "electric_monthly_tc": electric_monthly_tc["scenario_3"]},
        "scenario_4": {"power_requirement": power_requirements["scenario_4"], "basic_service_fee": fee["scenario_4"], "subscription_fee": sub_fee["scenario_4"], "commodity_distribution_cost": commodity_distribution_cost["scenario_4"], "electric_monthly_tc": electric_monthly_tc["scenario_4"]},
        "fossil_fuel_average_mpg": average_mpg,
        "adjusted_fossil_fuel_price": round(adjusted_fossil_fuel_price,2),
        "monthly_fossil_fuel_tc": round(monthly_fossil_fuel_tc,2),
        "error_checks": {
            "charger_cover_scenarios_2_and_4_flag": charger_cover_scenarios_2_and_4,
            "charger_cover_scenarios_1_and_3_flag": charger_cover_scenarios_1_and_3,
            "available_transformer_capacity_flag": available_transformer_capacity_check
        }
    }

# Enable CORS
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/graphql": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)