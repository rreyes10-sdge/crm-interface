from graphql_app.database import fetch_data  # Import your database fetching logic

class Resolvers:
    @staticmethod
    def resolve_project_overview(root, info, programId=None, projectName=None, projectNumber=None, status=None, organizationName=None):
        # Initialize conditions list
        conditions = []
 
        # Add conditions dynamically based on arguments
        if programId:
            conditions.append(f"p.ProgramId = {programId}")
        if projectName:
            conditions.append(f"p.Name LIKE '%{projectName}%'")  # Use LIKE for partial matches
        if projectNumber:
            conditions.append(f"p.ProjectNumber = '{projectNumber}'")
        if status:
            conditions.append(f"ps.LongName LIKE '%{status}%'")  # Assuming status column is in a joined table
        if organizationName:
            conditions.append(f"o.Name LIKE '%{organizationName}%'")  # Assuming organizationName column is in a joined table
 
        # Combine all conditions with AND
        where_clause = " AND ".join(conditions)
 
        # If no conditions are provided, avoid adding WHERE
        where_clause = f"WHERE {where_clause}" if where_clause else ""
 
        # Construct the SQL query
        query = f"""
        SELECT 
            p.ProjectNumber,
            p.Name AS ProjectName,
            ps.LongName AS Status,
            o.Name AS OrganizationName,
            A.ServiceSelectionCount AS TotalServicesSelected,
            COALESCE(B.ServicesCompleted, 0) AS ServicesCompleted,
            (A.ServiceSelectionCount - COALESCE(B.ServicesCompleted, 0)) AS OpenServices,
            CAST(ROUND((100.0 * (COALESCE(B.ServicesCompleted, 0)) / A.ServiceSelectionCount), 2) AS DECIMAL(7,2)) AS PercentCompleted,
            p.ProgramId
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
        ) B ON B.ProjectId = p.ProjectId
        LEFT JOIN cleantranscrm.ProjectStatus ps ON ps.ProjectStatusId = p.Status
        LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId
        {where_clause};  -- Dynamically insert WHERE clause
        """
 
        # Debug: Log the constructed query
        # print("Constructed SQL Query:", query)
 
        # Fetch data from the database
        df = fetch_data(query)
 
        # Log the fetched data
        # print("Fetched DataFrame:", df)
 
        # Return transformed data
        return [
            {
                "projectNumber": row["ProjectNumber"],
                "projectName": row["ProjectName"],
                "status": row["Status"],
                "organizationName": row["OrganizationName"],
                "totalServicesSelected": row["TotalServicesSelected"],
                "servicesCompleted": row["ServicesCompleted"],
                "openServices": row["OpenServices"],
                "percentCompleted": row["PercentCompleted"],
                "programId": row["ProgramId"],
            }
            for _, row in df.iterrows()
        ]