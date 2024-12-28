from flask import Flask, jsonify, request, render_template_string
from ariadne import QueryType, graphql_sync, make_executable_schema
from graphql_app.resolvers import Resolvers  
from flask_cors import CORS
from graphql_app.schema import type_defs
from .db_logic import fetch_and_process_data, get_connection, fetch_data
import pandas as pd
from .queries import QUERIES
from werkzeug.exceptions import HTTPException  # Import HTTPException from werkzeug

# Set up resolvers
query = QueryType()
query.set_field("projectOverview", Resolvers.resolve_project_overview)

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
        raise HTTPException(description=f"Query '{query_name}' not found", response=404)
        
    try:
        connection = get_connection()
        if connection is None:
            raise HTTPException(description="Database connection failed", response=500)
            
        df = fetch_data(QUERIES[query_name], connection)
        return jsonify(df.to_dict(orient='records'))
        
    except Exception as e:
        print("Error:", e)  # Log any exceptions
        raise HTTPException(description=str(e), response=500)
    finally:
        if connection:
            connection.close()

# Optional: Add a health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return {"status": "healthy"}

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)