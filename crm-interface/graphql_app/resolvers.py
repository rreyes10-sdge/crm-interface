from graphql_app.database import fetch_data, format_dates

class Resolvers:
    @staticmethod
    def resolve_project_overview(root, info, programId=None, projectName=None, projectNumber=None, projectStatus=None, organizationName=None):
        conditions = []
        params = {}

        if programId:
            conditions.append("p.ProgramId = %(programId)s")
            params['programId'] = programId
        if projectName:
            conditions.append("p.Name LIKE %(projectName)s")
            params['projectName'] = f"%{projectName}%"
        if projectNumber:
            conditions.append("p.ProjectNumber = %(projectNumber)s")
            params['projectNumber'] = projectNumber
        if projectStatus:
            conditions.append("ps.LongName LIKE %(status)s")
            params['status'] = f"%{projectStatus}%"
        if organizationName:
            conditions.append("o.Name LIKE %(organizationName)s")
            params['organizationName'] = f"%{organizationName}%"

        conditions.append("p.projectid NOT IN (3467)")
        conditions.append("p.deleted = 0")

        where_clause = " AND ".join(conditions)
        where_clause = f"WHERE {where_clause}" if where_clause else ""

        query = f"""SELECT 
            p.ProjectNumber,
            p.ProgramId,
            p.ProjectId,
            p.Name as 'ProjectName',
            o.Name as 'OrganizationName',
            o.OrganizationId,
            CASE
                WHEN p.StatusReasonSecondaryId = 22 THEN 'Duplicate'
                WHEN p.StatusReasonSecondaryId = 5 THEN 'Ineligible'
                ELSE ps.LongName
            END as 'ProjectStatus',
            u.ProperName as 'ProjectLead',
            CASE
                WHEN D.USC = 'true' THEN 'True'
                WHEN D.USC = 'false' THEN 'False'
                ELSE 'None'
            END AS 'USC',
            A.ServiceSelectionCount as 'TotalServicesSelected',
            COALESCE(B.ServicesCompleted, 0) as 'ServicesCompleted',
            COALESCE(C.ServicesStarted, 0) - COALESCE(B.ServicesCompleted, 0) as 'ServicesInProgress',
            (A.ServiceSelectionCount - COALESCE(B.ServicesCompleted, 0)) as 'OpenServices',
            CASE 
                WHEN A.ServiceSelectionCount - COALESCE(B.ServicesCompleted, 0) - 
                    (COALESCE(C.ServicesStarted, 0) - COALESCE(B.ServicesCompleted, 0)) < 0 THEN 0
                ELSE A.ServiceSelectionCount - COALESCE(B.ServicesCompleted, 0) - 
                    (COALESCE(C.ServicesStarted, 0) - COALESCE(B.ServicesCompleted, 0))
            END AS 'ServicesNotReady',
            CAST(ROUND((100.0 * (COALESCE(B.ServicesCompleted, 0))/A.ServiceSelectionCount),2) as DECIMAL(7,2)) as 'PercentCompleted'
        FROM cleantranscrm.Project p
        LEFT JOIN cleantranscrm.ProjectStatus ps ON ps.ProjectStatusId = p.Status
        LEFT JOIN cleantranscrm.ProjectRole pr ON pr.ProjectId = p.ProjectId
        LEFT JOIN cleantranscrm.`User` u ON pr.UserId = u.UserId
        LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId
        LEFT JOIN (
            SELECT 
                pav.ProjectId,
                COUNT(CASE WHEN pav.Value = 'True' THEN 1 END) AS 'ServiceSelectionCount'
            FROM cleantranscrm.ProjectAttributeValue pav
            LEFT JOIN cleantranscrm.ProgramAttribute pa ON pav.ProgramAttributeId = pa.ProgramAttributeId
            WHERE pa.ProgramId = 16 AND pa.PhaseId = 2
            GROUP BY pav.ProjectId
        ) A ON A.ProjectId = p.ProjectId
        LEFT JOIN (
            SELECT 
                pav.projectid,
                COUNT(CASE WHEN pav.Value IS NOT NULL THEN 1 END) AS 'ServicesCompleted'
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'complete' AND pav.Value IS NOT NULL
            GROUP BY pav.ProjectId
        ) B ON B.ProjectId = p.ProjectId
        LEFT JOIN (
            SELECT 
                pav.projectid,
                COUNT(CASE WHEN pav.Value IS NOT NULL THEN 1 END) AS 'ServicesStarted'
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Service Start Date' AND pav.Value IS NOT NULL
            GROUP BY pav.ProjectId
        ) C ON C.ProjectId = p.ProjectId
            LEFT JOIN (
            SELECT 
                pav.projectid,
                pav.Value AS 'USC'
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            WHERE pa.ProgramId = 16 AND pa.label = 'USC?' AND pav.Value IS NOT NULL
            GROUP BY pav.ProjectId
        ) D ON D.ProjectId = p.ProjectId
        {where_clause};
        """

        df = fetch_data(query, params)
        result = []
        for _, row in df.iterrows():
            result.append({
                'projectNumber': row['ProjectNumber'],
                'programId': row['ProgramId'],
                'projectId': row['ProjectId'],
                'projectName': row['ProjectName'],
                'organizationName': row['OrganizationName'],
                'organizationId': row['OrganizationId'],
                'projectStatus': row['ProjectStatus'],
                'projectLead': row['ProjectLead'],
                'usc': row['USC'],
                'totalServicesSelected': row['TotalServicesSelected'],
                'servicesCompleted': row['ServicesCompleted'],
                'servicesInProgress': row['ServicesInProgress'],
                'openServices': row['OpenServices'],
                'servicesNotReady': row['ServicesNotReady'],
                'percentCompleted': row['PercentCompleted']
            })
        return result
    
    @staticmethod
    def resolve_projects_with_follow_up_dates(root, info):
        query = """SELECT
            p.ProjectNumber,
            p.ProjectId,
            p.Name as 'ProjectName',
            o.Name AS 'OrganizationName',
            o.OrganizationId,
            tst2.Name AS 'CoreName',
            pa.Label AS 'ServiceName',
            A.Value AS 'ServiceStartDate',
            B.Value AS 'FollowUpDate',
            C.Value AS 'CompleteDate',
            COALESCE(activity.LatestActivity, 'No recorded activity yet') as 'LatestActivity',
            activity.CreatedAt
            FROM cleantranscrm.TeasSupportType tst
            LEFT JOIN cleantranscrm.TeasServiceType tst2 ON CAST(tst2.TeasServiceTypeId AS UNSIGNED) = CAST(tst.TeasServiceTypeId AS UNSIGNED)
            LEFT JOIN cleantranscrm.ProjectAttributeValue pal ON pal.ProgramAttributeId = CAST(tst.ProgramAttributeId AS UNSIGNED)
            LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramAttributeId = pal.ProgramAttributeId
            LEFT JOIN cleantranscrm.`Project` p ON p.ProjectId = pal.ProjectId
            LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = pa.PhaseId AND pp.ProgramId = pa.ProgramId
            LEFT JOIN cleantranscrm.SelectOption so ON pa.Source = so.SelectControlId
            AND pa.ControlType = 'select'
            AND CAST(pal.Value AS UNSIGNED) = so.OptionValue
            LEFT JOIN (
            SELECT 
                pav.projectid,
                tst.ProgramAttributeId,
                pa.Label,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Service Start Date' AND pav.Value IS NOT NULL
            ) A ON A.projectid = pal.ProjectId AND A.programattributeid = tst.programattributeid
            LEFT JOIN (
            SELECT 
                pav.projectid,
                tst.ProgramAttributeId,
                pa.Label,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Follow Up' AND pav.Value IS NOT NULL
            ) B ON B.projectid = pal.ProjectId AND B.programattributeid = tst.programattributeid
            LEFT JOIN (
            SELECT 
                pav.projectid,
                tst.ProgramAttributeId,
                pa.Label,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Complete' AND pav.Value IS NOT NULL
            ) C ON C.projectid = pal.ProjectId AND C.programattributeid = tst.programattributeid
            LEFT JOIN (
            SELECT 
                projectid,
                phaseid,
                MAX(a.ActivityId) as 'MaxId' ,
                MAX(a.`Text`) as 'LatestActivity',
                MAX(a.CreatedAt) as 'CreatedAt'
            FROM cleantranscrm.Activity a
            GROUP BY projectid, phaseid
            ) activity on activity.projectid = pal.ProjectId AND activity.phaseid = tst.PhaseId 
            WHERE
            pal.ProjectId IN (SELECT ProjectId FROM cleantranscrm.`Project` WHERE ProgramId = 16)
            AND pa.PhaseId = 2 AND pa.ProgramId = 16
            AND pal.Value = 'True'
            AND B.Value != ''
            AND (B.Value < CURDATE() OR B.Value BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) + INTERVAL 1 DAY)
            AND C.Value IS NULL
            GROUP BY p.ProjectNumber, tst2.Name, pa.Label
            ORDER BY B.value ASC;"""
        
        df = fetch_data(query)
        date_columns = ['ServiceStartDate', 'FollowUpDate', 'CompleteDate', 'CreatedAt']
        df = format_dates(df, date_columns)
        result = []
        for _, row in df.iterrows():
            result.append({
            'projectNumber': row['ProjectNumber'],
            'projectId': row['ProjectId'],
            'organizationName': row['OrganizationName'],
            'organizationId': row['OrganizationId'],
            'coreName': row['CoreName'],
            'serviceName': row['ServiceName'],
            'serviceStartDate': row['ServiceStartDate'],
            'followUpDate': row['FollowUpDate'],
            'completeDate': row['CompleteDate'],
            'latestActivity': row['LatestActivity'],
            'createdAt': row['CreatedAt']
            })
        return result

    @staticmethod
    def resolve_services_started(root, info):
        query = """SELECT
            p.ProjectNumber,
            p.ProjectId,
            o.Name as 'OrganizationName',
            o.OrganizationId,
            tst2.Name as 'CoreName',
            pa.Label AS ServiceName,
            A.Value AS 'ServiceStartDate',
            B.Value as 'FollowUpDate',
            C.Value as 'CompleteDate',
            COALESCE(activity.LatestActivity, 'No recorded activity yet') AS 'LatestActivity',
            activity.CreatedAt
            FROM cleantranscrm.TeasSupportType tst
            LEFT JOIN cleantranscrm.TeasServiceType tst2 on CAST(tst2.TeasServiceTypeId AS UNSIGNED) = CAST(tst.TeasServiceTypeId AS UNSIGNED)
            LEFT JOIN cleantranscrm.ProjectAttributeValue pal ON pal.ProgramAttributeId = CAST(tst.ProgramAttributeId AS UNSIGNED)
            LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramAttributeId = pal.ProgramAttributeId
            LEFT JOIN cleantranscrm.`Project` p ON p.ProjectId = pal.ProjectId
            LEFT JOIN cleantranscrm.Organization o on o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = pa.PhaseId AND pp.ProgramId = pa.ProgramId
            LEFT JOIN cleantranscrm.SelectOption so ON pa.Source = so.SelectControlId
            AND pa.ControlType = 'select'
            AND CAST(pal.Value AS UNSIGNED) = so.OptionValue
            LEFT JOIN (		SELECT 
                pav.projectid,
                tst.ProgramAttributeId ,
                pa.Label ,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Service Start Date' AND pav.Value IS NOT NULL
            ) A on A.projectid = pal.ProjectId and A.programattributeid = tst.programattributeid
            LEFT JOIN (		SELECT 
                pav.projectid,
                tst.ProgramAttributeId ,
                pa.Label ,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Follow Up' AND pav.Value IS NOT NULL
            ) B on B.projectid = pal.ProjectId and B.programattributeid = tst.programattributeid
            LEFT JOIN (		SELECT 
                pav.projectid,
                tst.ProgramAttributeId ,
                pa.Label ,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Complete' AND pav.Value IS NOT NULL
            ) C on C.projectid = pal.ProjectId and C.programattributeid = tst.programattributeid
            LEFT JOIN (
            SELECT 
                projectid,
                phaseid,
                MAX(a.ActivityId) as 'MaxId' ,
                MAX(a.`Text`) as 'LatestActivity',
                MAX(a.CreatedAt) as 'CreatedAt'
            FROM cleantranscrm.Activity a
            GROUP BY projectid, phaseid
            ) activity on activity.projectid = pal.ProjectId AND activity.phaseid = tst.PhaseId 
            WHERE
            pal.ProjectId IN (SELECT ProjectId FROM cleantranscrm.`Project` WHERE ProgramId = 16)
            AND pa.PhaseId = 2 AND pa.ProgramId = 16 AND pal.Value='True'
            AND C.Value IS NULL
            AND A.Value is not null
            GROUP BY p.ProjectNumber, tst2.Name, pa.Label
            ORDER BY
            A.Value ASC;"""
        
        df = fetch_data(query)
        date_columns = ['ServiceStartDate', 'FollowUpDate', 'CompleteDate', 'CreatedAt']
        df = format_dates(df, date_columns)
        result = []
        for _, row in df.iterrows():
            result.append({
            'projectNumber': row['ProjectNumber'],
            'projectId': row['ProjectId'],
            'organizationName': row['OrganizationName'],
            'organizationId': row['OrganizationId'],
            'coreName': row['CoreName'],
            'serviceName': row['ServiceName'],
            'serviceStartDate': row['ServiceStartDate'],
            'followUpDate': row['FollowUpDate'],
            'completeDate': row['CompleteDate'],
            'latestActivity': row['LatestActivity'],
            'createdAt': row['CreatedAt']
            })
        return result

    @staticmethod
    def resolve_projects_not_started(root, info):
        query = """SELECT * FROM (
            SELECT
                p.ProjectNumber,
                p.ProjectId, 
                o.Name AS 'OrganizationName',
                o.OrganizationId,
                tst2.Name AS 'CoreName',
                pa.Label AS 'ServiceName',
                A.Value AS 'ServiceStartDate',
                B.Value as 'FollowUpDate',
                C.Value as 'CompleteDate',
                COALESCE(activity.LatestActivity, 'No recorded activity yet') AS 'LatestActivity',
                activity.CreatedAt
            FROM cleantranscrm.TeasSupportType tst
            LEFT JOIN cleantranscrm.TeasServiceType tst2 on CAST(tst2.TeasServiceTypeId AS UNSIGNED) = CAST(tst.TeasServiceTypeId AS UNSIGNED)
            LEFT JOIN cleantranscrm.ProjectAttributeValue pal ON pal.ProgramAttributeId = CAST(tst.ProgramAttributeId AS UNSIGNED)
            LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramAttributeId = pal.ProgramAttributeId
            LEFT JOIN cleantranscrm.`Project` p ON p.ProjectId = pal.ProjectId
            LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = pa.PhaseId AND pp.ProgramId = pa.ProgramId
            LEFT JOIN cleantranscrm.SelectOption so ON pa.Source = so.SelectControlId
                AND pa.ControlType = 'select'
                AND CAST(pal.Value AS UNSIGNED) = so.OptionValue
            LEFT JOIN (		SELECT 
                    pav.projectid,
                    tst.ProgramAttributeId ,
                    pa.Label ,
                    pav.Value
                FROM cleantranscrm.ProgramAttribute pa
                LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
                LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
                LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
                WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Service Start Date' AND pav.Value IS NOT NULL
                ) A on A.projectid = pal.ProjectId and A.programattributeid = tst.programattributeid
            LEFT JOIN (		SELECT 
                    pav.projectid,
                    tst.ProgramAttributeId ,
                    pa.Label ,
                    pav.Value
                FROM cleantranscrm.ProgramAttribute pa
                LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
                LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
                LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
                WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Follow Up' AND pav.Value IS NOT NULL
                ) B on B.projectid = pal.ProjectId and B.programattributeid = tst.programattributeid
            LEFT JOIN (		SELECT 
                    pav.projectid,
                    tst.ProgramAttributeId ,
                    pa.Label ,
                    pav.Value
                FROM cleantranscrm.ProgramAttribute pa
                LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
                LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
                LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
                WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Complete' AND pav.Value IS NOT NULL
                ) C on C.projectid = pal.ProjectId and C.programattributeid = tst.programattributeid
            LEFT JOIN (
                SELECT 
                    projectid,
                    phaseid,
                    MAX(a.ActivityId) as 'MaxId' ,
                    MAX(a.`Text`) as 'LatestActivity',
                    MAX(a.CreatedAt) as 'CreatedAt'
                FROM cleantranscrm.Activity a
                GROUP BY projectid, phaseid
            ) activity on activity.projectid = pal.ProjectId AND activity.phaseid = tst.PhaseId 
            WHERE
                pal.ProjectId IN (SELECT ProjectId FROM cleantranscrm.`Project` WHERE ProgramId = 16)
                AND pa.PhaseId = 2 AND pa.ProgramId = 16 AND pal.Value='True'
            GROUP BY p.ProjectNumber, tst2.Name, pa.Label
            ORDER BY
                p.ProjectNumber ASC, pp.SortOrder ASC, pa.SortOrder ASC
            ) CTE_A
            WHERE CTE_A.ServiceStartDate IS NULL AND CTE_A.FollowUpDate IS NULL
            ORDER BY 
            CTE_A.ProjectNumber ASC"""
        
        df = fetch_data(query)
        date_columns = ['ServiceStartDate', 'FollowUpDate', 'CompleteDate', 'CreatedAt']
        df = format_dates(df, date_columns)
        result = []
        for _, row in df.iterrows():
            result.append({
            'projectNumber': row['ProjectNumber'],
            'projectId': row['ProjectId'],
            'organizationName': row['OrganizationName'],
            'organizationId': row['OrganizationId'],
            'coreName': row['CoreName'],
            'serviceName': row['ServiceName'],
            'serviceStartDate': row['ServiceStartDate'],
            'followUpDate': row['FollowUpDate'],
            'completeDate': row['CompleteDate'],
            'latestActivity': row['LatestActivity'],
            'createdAt': row['CreatedAt']
            })
        return result

    @staticmethod
    def resolve_completed_projects(root, info):
        query = """SELECT
            p.ProjectNumber,
            p.ProjectId,
            o.Name AS 'OrganizationName',
            o.OrganizationId,
            tst2.Name AS 'CoreName',
            pa.Label AS 'ServiceName',
            A.Value AS 'ServiceStartDate',
            B.Value AS 'FollowUpDate',
            C.Value AS 'CompleteDate',
            COALESCE(activity.LatestActivity, 'No recorded activity yet') as 'LatestActivity',
            activity.CreatedAt
            FROM cleantranscrm.TeasSupportType tst
            LEFT JOIN cleantranscrm.TeasServiceType tst2 ON CAST(tst2.TeasServiceTypeId AS UNSIGNED) = CAST(tst.TeasServiceTypeId AS UNSIGNED)
            LEFT JOIN cleantranscrm.ProjectAttributeValue pal ON pal.ProgramAttributeId = CAST(tst.ProgramAttributeId AS UNSIGNED)
            LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramAttributeId = pal.ProgramAttributeId
            LEFT JOIN cleantranscrm.`Project` p ON p.ProjectId = pal.ProjectId
            LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId 
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = pa.PhaseId AND pp.ProgramId = pa.ProgramId
            LEFT JOIN cleantranscrm.SelectOption so ON pa.Source = so.SelectControlId
            AND pa.ControlType = 'select'
            AND CAST(pal.Value AS UNSIGNED) = so.OptionValue
            LEFT JOIN (
            SELECT 
                pav.projectid,
                tst.ProgramAttributeId,
                pa.Label,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Service Start Date' AND pav.Value IS NOT NULL
            ) A ON A.projectid = pal.ProjectId AND A.programattributeid = tst.programattributeid
            LEFT JOIN (
            SELECT 
                pav.projectid,
                tst.ProgramAttributeId,
                pa.Label,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Follow Up' AND pav.Value IS NOT NULL
            ) B ON B.projectid = pal.ProjectId AND B.programattributeid = tst.programattributeid
            LEFT JOIN (
            SELECT 
                pav.projectid,
                tst.ProgramAttributeId,
                pa.Label,
                pav.Value
            FROM cleantranscrm.ProgramAttribute pa
            LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
            LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
            LEFT JOIN cleantranscrm.TeasSupportType tst ON tst.PhaseId = pa.PhaseId 
            WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Complete' AND pav.Value IS NOT NULL
            ) C ON C.projectid = pal.ProjectId AND C.programattributeid = tst.programattributeid
            LEFT JOIN (
            SELECT 
                projectid,
                phaseid,
                MAX(a.ActivityId) as 'MaxId' ,
                MAX(a.`Text`) as 'LatestActivity',
                MAX(a.CreatedAt) as 'CreatedAt'
            FROM cleantranscrm.Activity a
            GROUP BY projectid, phaseid
            ) activity on activity.projectid = pal.ProjectId AND activity.phaseid = tst.PhaseId 
            WHERE
            pal.ProjectId IN (SELECT ProjectId FROM cleantranscrm.`Project` WHERE ProgramId = 16)
            AND pa.PhaseId = 2 AND pa.ProgramId = 16
            AND pal.Value = 'True'
            AND C.Value IS NOT NULL
            GROUP BY p.ProjectNumber, tst2.Name, pa.Label
            ORDER BY B.value ASC;"""
        
        df = fetch_data(query)
        date_columns = ['ServiceStartDate', 'FollowUpDate', 'CompleteDate', 'CreatedAt']
        df = format_dates(df, date_columns)
        result = []
        for _, row in df.iterrows():
            result.append({
            'projectNumber': row['ProjectNumber'],
            'projectId': row['ProjectId'],
            'organizationName': row['OrganizationName'],
            'organizationId': row['OrganizationId'],
            'coreName': row['CoreName'],
            'serviceName': row['ServiceName'],
            'serviceStartDate': row['ServiceStartDate'],
            'followUpDate': row['FollowUpDate'],
            'completeDate': row['CompleteDate'],
            'latestActivity': row['LatestActivity'],
            'createdAt': row['CreatedAt']
            })
        return result