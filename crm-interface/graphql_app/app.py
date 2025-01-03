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

# Optional: Add a health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return {"status": "healthy"}

# Enable CORS
CORS(app, resources={r"/graphql": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)