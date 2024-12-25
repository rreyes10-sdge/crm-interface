from graphql_app.graphql_types import ProjectOverviewType
from graphql_app.database import fetch_data

class Resolvers:
    @staticmethod
    def resolve_project_overview(root, info):
        query = """
        SELECT 
            p.ProjectNumber,
            p.Name AS 'ProjectName',
            A.ServiceSelectionCount AS 'TotalServicesSelected',
            COALESCE(B.ServicesCompleted, 0) AS 'ServicesCompleted',
            (A.ServiceSelectionCount - COALESCE(B.ServicesCompleted, 0)) AS 'OpenServices',
            CAST(ROUND((100.0 * (COALESCE(B.ServicesCompleted, 0))/A.ServiceSelectionCount), 2) AS DECIMAL(7,2)) AS '% Completed'
        FROM cleantranscrm.Project p
        LEFT JOIN (
            SELECT 
                pav.ProjectId,
                COUNT(CASE WHEN pav.Value = 'True' THEN 1 END) AS 'ServiceSelectionCount'
            FROM cleantranscrm.ProjectAttributeValue pav
            GROUP BY pav.ProjectId
        ) A ON A.ProjectId = p.ProjectId
        LEFT JOIN (
            SELECT 
                pav.ProjectId,
                COUNT(CASE WHEN pav.Value IS NOT NULL THEN 1 END) AS 'ServicesCompleted'
            FROM cleantranscrm.ProjectAttributeValue pav
            GROUP BY pav.ProjectId
        ) B ON B.ProjectId = p.ProjectId
        """
        
        df = fetch_data(query)
        return [
            ProjectOverviewType(
                project_number=row['ProjectNumber'],
                project_name=row['ProjectName'],
                total_services_selected=row['TotalServicesSelected'],
                services_completed=row['ServicesCompleted'],
                open_services=row['OpenServices'],
                percent_completed=row['% Completed']
            )
            for _, row in df.iterrows()
        ]