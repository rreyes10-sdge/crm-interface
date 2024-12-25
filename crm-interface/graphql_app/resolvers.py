from graphql_app.database import fetch_data  # Import your database fetching logic
 
class Resolvers:
    @staticmethod
    def resolve_project_overview(root, info):
        # SQL query to fetch project overview data
        query = """
        SELECT 
            p.ProjectNumber,
            p.Name AS ProjectName,
            A.ServiceSelectionCount AS TotalServicesSelected,
            COALESCE(B.ServicesCompleted, 0) AS ServicesCompleted,
            (A.ServiceSelectionCount - COALESCE(B.ServicesCompleted, 0)) AS OpenServices,
            CAST(ROUND((100.0 * (COALESCE(B.ServicesCompleted, 0)) / A.ServiceSelectionCount), 2) AS DECIMAL(7,2)) AS PercentCompleted,
            p.ProgramId AS ProgramId
        FROM cleantranscrm.Project p
        LEFT JOIN (
            SELECT 
                pav.ProjectId,
                COUNT(CASE WHEN pav.Value = 'True' THEN 1 END) AS ServiceSelectionCount
            FROM cleantranscrm.ProjectAttributeValue pav
            GROUP BY pav.ProjectId
        ) A ON A.ProjectId = p.ProjectId
        LEFT JOIN (
            SELECT 
                pav.ProjectId,
                COUNT(CASE WHEN pav.Value IS NOT NULL THEN 1 END) AS ServicesCompleted
            FROM cleantranscrm.ProjectAttributeValue pav
            GROUP BY pav.ProjectId
        ) B ON B.ProjectId = p.ProjectId;
        """
 
        # Fetch data from the database
        df = fetch_data(query)
 
        # Check if data is empty
        if df.empty:
            print("No data returned from the database.")
            return []
 
        # Map the database results to the GraphQL schema
        return [
            {
                "projectNumber": row["ProjectNumber"],
                "projectName": row["ProjectName"],
                "totalServicesSelected": row["TotalServicesSelected"],
                "servicesCompleted": row["ServicesCompleted"],
                "openServices": row["OpenServices"],
                "percentCompleted": row["PercentCompleted"],
                "programId": row["ProgramId"],

            }
            for _, row in df.iterrows()
        ]