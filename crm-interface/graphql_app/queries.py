# SQL queries for dashboard data

QUERY_SUMMARY = """SELECT 
        p.ProjectNumber,
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
        CAST(ROUND((100.0 * (COALESCE(B.ServicesCompleted, 0))/A.ServiceSelectionCount),2) as DECIMAL(7,2)) as 'PercentCompleted',
        COALESCE(E.TotalDurationMins, 0) as 'TotalDurationMins'
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
    LEFT JOIN (
        SELECT 
            p.ProjectId,
            SUM(a.Duration) as 'TotalDurationMins'
        FROM cleantranscrm.Activity a
        LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId 
        LEFT JOIN cleantranscrm.ProgramPhase pp on pp.PhaseId = a.PhaseId and pp.ProgramId = 16
        WHERE a.ActivityTypeId in (1,2,3,4,5,6)
        GROUP BY p.ProjectId
    ) E ON E.ProjectId = p.ProjectId
    WHERE p.programid = 16 and p.projectid not in (3467) and p.deleted = 0"""

QUERY_DURATION = """SELECT 
        p.ProjectId,
        p.ProjectNumber,
        pp.Name as 'PhaseName',
        SUM(a.Duration) as 'TotalDurationMins',
        MAX(a.ActivityId) as 'MaxId' ,
        MAX(a.`Text`) as 'LatestText',
        MAX(a.CreatedAt) as 'CreateAt'
    FROM cleantranscrm.Activity a
    LEFT JOIN cleantranscrm.`User` u ON a.UserId = u.UserId 
    LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId 
    LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId 
    LEFT JOIN cleantranscrm.ActivityType at on at.ActivityTypeId = a.ActivityTypeId 
    LEFT JOIN cleantranscrm.ProgramPhase pp on pp.PhaseId = a.PhaseId and pp.ProgramId = 16
    WHERE p.ProgramId = 16
    AND a.ActivityTypeId in (1,2,3,4,5,6)
    group by p.ProjectId, a.PhaseId 
    ORDER BY p.ProjectId asc;"""

# Dictionary mapping query names to their SQL strings
QUERIES = {
    'summary': QUERY_SUMMARY,
    'duration': QUERY_DURATION,
    # ... add other queries with descriptive names
}