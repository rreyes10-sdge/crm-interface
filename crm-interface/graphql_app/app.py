from flask import Flask, jsonify, request, render_template_string, abort
from ariadne import QueryType, graphql_sync, make_executable_schema
from graphql_app.resolvers import Resolvers  
from flask_cors import CORS
from graphql_app.schema import type_defs
from .db_logic import get_connection, fetch_data, format_dates, get_project_service_attributes
import pandas as pd
from .queries import QUERIES
from werkzeug.exceptions import HTTPException

# Set up resolvers
query = QueryType()
query.set_field("projectOverview", Resolvers.resolve_project_overview)
query.set_field("projectsWithFollowUpDates", Resolvers.resolve_projects_with_follow_up_dates)
query.set_field("servicesStarted", Resolvers.resolve_services_started)
query.set_field("projectsNotStarted", Resolvers.resolve_projects_not_started)
query.set_field("completedProjects", Resolvers.resolve_completed_projects)
query.set_field("projectTimeline", Resolvers.resolve_project_timeline)

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
    try:
        conn = get_connection()
        active_users_query = """
            select u.UserId, u.ProperName, r.Name as 'RoleName', COALESCE(u.LastLoginAt, 'Never logged in') AS LastLoginAt  from cleantranscrm.`User` u 
            left join cleantranscrm.UserRole ur on ur.UserId = u.UserId 
            left join cleantranscrm.`Role` r on r.RoleId = ur.RoleId 
            WHERE u.Active = 1
            Order by r.RoleId ASC, u.ProperName ASC;
        """
        active_users = fetch_data(active_users_query, conn).to_dict(orient='records')
        return jsonify({"active_users": active_users})
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
            WHERE UserId = %s AND CreatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        activity_count = int(fetch_data(activity_count_query, conn, params=(user_id, time_range)).iloc[0]['activity_count'])

        # Activity logs
        activity_logs_query = """
            SELECT a.UserId, a.`Text`, a.CreatedAt, at2.Name as 'ActivityType', COALESCE(a.Duration, 0) as 'Duration', COALESCE(pp.PhaseId,0) AS 'PhaseId', 
                   pp.Name as 'PhaseName', p.ProjectId,  p.ProjectNumber, p.Name as 'ProjectName', o.Name as 'OrgName'
            FROM cleantranscrm.Activity a
            LEFT JOIN cleantranscrm.ActivityType at2 on at2.ActivityTypeId = a.ActivityTypeId 
            LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId
            LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = a.PhaseId AND pp.ProgramId = a.ProgramId
            WHERE a.UserId = %s AND a.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        activity_logs = fetch_data(activity_logs_query, conn, params=(user_id, time_range)).to_dict(orient='records')

        # Uploaded files count
        uploaded_files_count_query = """
            SELECT COUNT(*) AS uploaded_files_count
            FROM cleantranscrm.Attachment a 
            WHERE StoredByUserId = %s AND TimeStored >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        uploaded_files_count = int(fetch_data(uploaded_files_count_query, conn, params=(user_id, time_range)).iloc[0]['uploaded_files_count'])

        # Uploaded files details
        uploaded_files_query = """
            SELECT B.Label ,a.AttachmentId , a.Title , a.TimeStored , a.StoredByUserId, a.Filename, a.Description , COALESCE(pp.PhaseId,0) AS 'PhaseId', pp.Name as 'PhaseName', p.ProjectId, p.ProjectNumber, p.Name as 'ProjectName', o.Name as 'OrgName'
            FROM cleantranscrm.Attachment a 
            left join cleantranscrm.Project p on p.ProjectId = a.ProjectId 
            left join cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            left join cleantranscrm.ProgramPhase pp on pp.PhaseId = a.PhaseId and pp.ProgramId = a.ProgramId 
            left join (select pav.ProjectId, pav.UpdatedAt, pav.UpdatedBy, pav.Value, pa.Label from cleantranscrm.ProjectAttributeValue pav 
                left join cleantranscrm.ProgramAttribute pa on pa.ProgramAttributeId = pav.ProgramAttributeId 
                where pa.ControlType = 'doc') B on B.Value = a.AttachmentId 
            WHERE a.StoredByUserId = %s AND a.TimeStored >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
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
            SELECT pav.*, u.UserId , COALESCE(pp.PhaseId,0) AS 'PhaseId', pa.Label, pp.Name as 'PhaseName', p.ProjectId,  p.ProjectNumber, p.Name as 'ProjectName', o.Name as 'OrgName' 
            FROM cleantranscrm.ProjectAttributeValue pav
            LEFT JOIN cleantranscrm.ProgramAttribute pa on pa.ProgramAttributeId = pav.ProgramAttributeId 
            LEFT JOIN cleantranscrm.`User` u on u.ProperName = pav.UpdatedBy
            LEFT JOIN cleantranscrm.Project p on p.ProjectId = pav.ProjectId 
            LEFT JOIN cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.ProgramPhase pp on pp.PhaseId = pa.PhaseId and pp.ProgramId = pa.ProgramId 
            WHERE u.UserId = %s AND pav.UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        attributes_filled = fetch_data(attributes_filled_query, conn, params=(user_id, time_range)).to_dict(orient='records')

        # Project table values count
        project_table_values_count_query = """
            SELECT COUNT(*) AS project_table_values_count
            FROM cleantranscrm.ProjectTableValue ptv
            WHERE UpdatedBy = %s AND UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        project_table_values_count = int(fetch_data(project_table_values_count_query, conn, params=(user_id, time_range)).iloc[0]['project_table_values_count'])

        # Project table values
        project_table_values_query = """
            SELECT t.Name as 'TableName', tc.Label , tc.Description , tc.SortOrder
                , CASE 
                    WHEN tc.ControlType = 'select' THEN so.OptionText
                ELSE ptv.Value END AS 'Value'
                , ptv.`Row`, ptv.UpdatedAt , ptv.UpdatedBy, COALESCE(pp.PhaseId,0) AS 'PhaseId', pp.Name as 'PhaseName', p.ProjectId,  p.ProjectNumber, p.Name as 'ProjectName', o.Name as 'OrgName' 
            FROM cleantranscrm.ProjectTableValue ptv
            LEFT JOIN cleantranscrm.`Table` t on t.TableId = ptv.TableId 
            LEFT JOIN cleantranscrm.TableColumn tc on tc.TableColumnId = ptv.TableColumnId 
            LEFT JOIN cleantranscrm.ProgramAttribute pa on pa.TableId = t.TableId 
            LEFT JOIN cleantranscrm.SelectControl sc on sc.SelectControlId = tc.Source 
            LEFT JOIN cleantranscrm.SelectOption so on so.SelectControlId = sc.SelectControlId 
            LEFT JOIN cleantranscrm.Project p on p.ProjectId = ptv.ProjectId 
            LEFT JOIN cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.ProgramPhase pp on pp.PhaseId = pa.PhaseId and pp.ProgramId = pa.ProgramId 
            WHERE ptv.UpdatedBy = %s AND ptv.UpdatedAt >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        """
        project_table_values = fetch_data(project_table_values_query, conn, params=(user_id, time_range)).to_dict(orient='records')

        # # User projects promoted or demoted
        # user_projects_promoted_demoted_query = """
        #     SELECT project_id, project_name, status
        #     FROM user_projects
        #     WHERE user_id = %s AND status_change_date >= DATE_SUB(CURDATE(), INTERVAL %s DAY);
        # """
        # user_projects_promoted_demoted = fetch_data(user_projects_promoted_demoted_query, conn, params=(user_id, time_range)).to_dict(orient='records')

        # User saved filters
        user_saved_filters_query = """
            SELECT *
            FROM cleantranscrm.SavedFilter sf 
            WHERE UserId = %s;
        """
        user_saved_filters = fetch_data(user_saved_filters_query, conn, params=(user_id)).to_dict(orient='records')

        # User favorited projects
        user_favorited_projects_query = """
            select * from cleantranscrm.FavoriteProject fp WHERE UserId = %s
        """
        user_favorited_projects = fetch_data(user_favorited_projects_query, conn, params=(user_id)).to_dict(orient='records')

        stats = {
            "activity_count": activity_count,
            "activity_logs": activity_logs,
            "uploaded_files_count": uploaded_files_count,
            "uploaded_files": uploaded_files,
            "attributes_filled_count": attributes_filled_count,
            "attributes_filled": attributes_filled,
            "project_table_values_count": project_table_values_count,
            "project_table_values": project_table_values,
            # "user_projects_promoted_demoted": user_projects_promoted_demoted,
            "user_saved_filters": user_saved_filters,
            "user_favorited_projects": user_favorited_projects
        }

        return jsonify({"stats": stats})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
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