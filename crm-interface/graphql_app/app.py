from flask import Flask, jsonify, request, render_template_string
from ariadne import QueryType, graphql_sync, make_executable_schema  # Ensure QueryType is imported
from graphql_app.resolvers import Resolvers  
from flask_cors import CORS
from graphql_app.schema import type_defs

# Set up resolvers
query = QueryType()
query.set_field("projectOverview", Resolvers.resolve_project_overview)

# Create the executable schema
schema = make_executable_schema(type_defs, query)

# Set up Flask app
app = Flask(__name__)

# @app.before_request
# def log_request():
    # print("Request URL:", request.url)
    # print("Request Method:", request.method)
    # print("Request Headers:", request.headers)
    # print("Request Body:", request.get_data().decode("utf-8"))

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
    # print("Request received at /graphql")
    # print("Headers:", request.headers)
    # print("Body:", request.get_data().decode("utf-8"))  # Log raw request body
    try:
        data = request.get_json()
        # print("Parsed JSON Body:", data)  # Log parsed JSON
        success, result = graphql_sync(schema, data, context_value=request, debug=True)
        status_code = 200 if success else 400
        return jsonify(result), status_code
    except Exception as e:
        print("Error:", e)  # Log any exceptions
        return jsonify({"error": str(e)}), 400
    
@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')

# Enable CORS
CORS(app, resources={r"/graphql": {"origins": "*"}})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)