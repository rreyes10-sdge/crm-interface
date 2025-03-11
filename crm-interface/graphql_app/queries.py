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
        F.SubmissionDate,
        G.VettingCall,
        H.ConsultationCall,
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
        WHERE pa.ProgramId = 16 AND pa.PhaseId = 2 AND pav.ProgramAttributeId not in (select programattributeid from cleantranscrm.TeasServiceType)
        GROUP BY pav.ProjectId
    ) A ON A.ProjectId = p.ProjectId
    LEFT JOIN (
        SELECT 
            pav.projectid,
            COUNT(CASE WHEN pav.Value IS NOT NULL THEN 1 END) AS 'ServicesCompleted'
        FROM cleantranscrm.ProgramAttribute pa
        LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
        LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
        WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'complete' AND pav.Value IS NOT NULL AND pav.ProgramAttributeId not in (select programattributeid from cleantranscrm.TeasServiceType)
        GROUP BY pav.ProjectId
    ) B ON B.ProjectId = p.ProjectId
    LEFT JOIN (
        SELECT 
            pav.projectid,
            COUNT(CASE WHEN pav.Value IS NOT NULL THEN 1 END) AS 'ServicesStarted'
        FROM cleantranscrm.ProgramAttribute pa
        LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
        LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
        WHERE pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Service Start Date' AND pav.Value IS NOT NULL AND pav.ProgramAttributeId not in (select programattributeid from cleantranscrm.TeasServiceType)
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
    LEFT JOIN (
        SELECT 
            pav.projectid,
            pav.Value AS 'SubmissionDate'
        FROM cleantranscrm.ProgramAttribute pa
        LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
        LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
        WHERE pa.ProgramId = 16 AND pa.label = 'Submission Date' AND pav.Value IS NOT NULL
        GROUP BY pav.ProjectId
    ) F ON F.ProjectId = p.ProjectId
    LEFT JOIN (
        SELECT 
            pav.projectid,
            pav.Value AS 'VettingCall'
        FROM cleantranscrm.ProgramAttribute pa
        LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
        LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
        WHERE pa.ProgramId = 16 AND pa.label = 'Vetting Call' AND pav.Value IS NOT NULL
        GROUP BY pav.ProjectId
    ) G ON G.ProjectId = p.ProjectId
    LEFT JOIN (
        SELECT 
            pav.projectid,
            pav.Value AS 'ConsultationCall'
        FROM cleantranscrm.ProgramAttribute pa
        LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pa.PhaseId = pp.PhaseId
        LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId
        WHERE pa.ProgramId = 16 AND pa.label = 'Consultation Call' AND pav.Value IS NOT NULL
        GROUP BY pav.ProjectId
    ) H ON H.ProjectId = p.ProjectId
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

QUERY_PROJECTS = """-- Generate a series of dates for the past 30 days
WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
)
SELECT 
    ds.Date AS LogDate,
    COALESCE(COUNT(DISTINCT p.ProjectId), 0) AS ProjectCount
FROM DateSeries ds
LEFT JOIN cleantranscrm.Project p ON DATE(p.CreatedAt) = ds.Date AND p.ProgramId = 16
WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
GROUP BY ds.Date
ORDER BY ds.Date;"""

QUERY_PROJECTS_TREND = """-- Generate a series of dates for the past 30 days
WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
),
-- Query to count projects each day
ProjectCounts AS (
    SELECT 
        ds.Date AS LogDate,
        COALESCE(COUNT(DISTINCT p.ProjectId), 0) AS ProjectCount
    FROM DateSeries ds
    LEFT JOIN cleantranscrm.Project p ON DATE(p.CreatedAt) = ds.Date AND p.ProgramId = 16
    WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
    GROUP BY ds.Date
    ORDER BY ds.Date
),
-- Calculate the average count for the first half of the 30-day period
FirstHalf AS (
    SELECT AVG(ProjectCount) AS AvgFirstHalf
    FROM ProjectCounts
    WHERE LogDate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() - INTERVAL 16 DAY
),
-- Calculate the average count for the second half of the 30-day period
SecondHalf AS (
    SELECT AVG(ProjectCount) AS AvgSecondHalf
    FROM ProjectCounts
    WHERE LogDate BETWEEN CURDATE() - INTERVAL 15 DAY AND CURDATE()
)
-- Determine the trend based on the averages
SELECT 
    CASE 
        WHEN sh.AvgSecondHalf > fh.AvgFirstHalf THEN 'up'
        WHEN sh.AvgSecondHalf < fh.AvgFirstHalf THEN 'down'
        ELSE 'neutral'
    END AS Trend,
    CASE 
        WHEN fh.AvgFirstHalf = 0 THEN 0
        ELSE ROUND(((sh.AvgSecondHalf - fh.AvgFirstHalf) / fh.AvgFirstHalf) * 100, 2)
    END AS PercentageChange
FROM FirstHalf fh, SecondHalf sh;"""

QUERY_LOGGED_ACTIVITIES = """WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
)
SELECT 
    ds.Date AS LogDate,
    COUNT(a.ActivityId) AS ActivityCount
FROM DateSeries ds
LEFT JOIN cleantranscrm.Activity a ON DATE(a.CreatedAt) = ds.Date AND a.ProjectId in (select projectid from cleantranscrm.Project p where ProgramId = 16) 
LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId AND p.ProgramId = 16
WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
GROUP BY ds.Date
ORDER BY ds.Date;"""

QUERY_LOGGED_ACTIVITIES_TREND = """-- Generate a series of dates for the past 30 days
WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
),
-- Query to count activities logged each day
ActivityCounts AS (
    SELECT 
        ds.Date AS LogDate,
        COALESCE(COUNT(a.ActivityId), 0) AS ActivityCount
    FROM DateSeries ds
    LEFT JOIN cleantranscrm.Activity a ON DATE(a.CreatedAt) = ds.Date AND a.ProjectId in (select projectid from cleantranscrm.Project p where ProgramId = 16) 
    LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId
    WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
    GROUP BY ds.Date
    ORDER BY ds.Date
),
-- Calculate the average count for the first half of the 30-day period
FirstHalf AS (
    SELECT AVG(ActivityCount) AS AvgFirstHalf
    FROM ActivityCounts
    WHERE LogDate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() - INTERVAL 16 DAY
),
-- Calculate the average count for the second half of the 30-day period
SecondHalf AS (
    SELECT AVG(ActivityCount) AS AvgSecondHalf
    FROM ActivityCounts
    WHERE LogDate BETWEEN CURDATE() - INTERVAL 15 DAY AND CURDATE()
)
-- Determine the trend based on the averages
SELECT 
    CASE 
        WHEN sh.AvgSecondHalf > fh.AvgFirstHalf THEN 'up'
        WHEN sh.AvgSecondHalf < fh.AvgFirstHalf THEN 'down'
        ELSE 'neutral'
    END AS Trend,
    CASE 
        WHEN fh.AvgFirstHalf = 0 THEN 0
        ELSE ROUND(((sh.AvgSecondHalf - fh.AvgFirstHalf) / fh.AvgFirstHalf) * 100, 2)
    END AS PercentageChange
FROM FirstHalf fh, SecondHalf sh;"""

QUERY_LOGGED_TIME = """WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
)
SELECT 
    ds.Date AS LogDate,
    COALESCE(SUM(a.Duration), 0) AS DurationTotal
FROM DateSeries ds
LEFT JOIN cleantranscrm.Activity a ON DATE(a.CreatedAt) = ds.Date AND a.ProjectId in (select projectid from cleantranscrm.Project p where ProgramId = 16) 
LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId AND p.ProgramId = 16
WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
GROUP BY ds.Date
ORDER BY ds.Date;"""

QUERY_LOGGED_TIME_TREND = """-- Generate a series of dates for the past 30 days
WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
),
-- Query to count activities logged each day
DurationTotal AS (
    SELECT 
    ds.Date AS LogDate,
    COALESCE(SUM(a.Duration),0) AS DurationTotal
FROM DateSeries ds
LEFT JOIN cleantranscrm.Activity a ON DATE(a.CreatedAt) = ds.Date AND a.ProjectId in (select projectid from cleantranscrm.Project p where ProgramId = 16) 
LEFT JOIN cleantranscrm.Project p ON p.ProjectId = a.ProjectId AND p.ProgramId = 16
WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
GROUP BY ds.Date
ORDER BY ds.Date
),
-- Calculate the average count for the first half of the 30-day period
FirstHalf AS (
    SELECT AVG(DurationTotal) AS AvgFirstHalf
    FROM DurationTotal
    WHERE LogDate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() - INTERVAL 16 DAY
),
-- Calculate the average count for the second half of the 30-day period
SecondHalf AS (
    SELECT AVG(DurationTotal) AS AvgSecondHalf
    FROM DurationTotal
    WHERE LogDate BETWEEN CURDATE() - INTERVAL 15 DAY AND CURDATE()
)
-- Determine the trend based on the averages
SELECT 
    CASE 
        WHEN sh.AvgSecondHalf > fh.AvgFirstHalf THEN 'up'
        WHEN sh.AvgSecondHalf < fh.AvgFirstHalf THEN 'down'
        ELSE 'neutral'
    END AS Trend,
    CASE 
        WHEN fh.AvgFirstHalf = 0 THEN 0
        ELSE ROUND(((sh.AvgSecondHalf - fh.AvgFirstHalf) / fh.AvgFirstHalf) * 100, 2)
    END AS PercentageChange
FROM FirstHalf fh, SecondHalf sh;"""

QUERY_ATTRIBUTES_FILLED = """WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
)
-- Query to count attributes filled in each day
SELECT 
    ds.Date AS CompletionDate,
    COALESCE(COUNT(pav.Id), 0) AS FilledCount
FROM DateSeries ds
LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON DATE(pav.UpdatedAt) = ds.Date and pav.ProjectId in (select projectid from cleantranscrm.Project p where ProgramId = 16) 
WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
GROUP BY ds.Date
ORDER BY ds.Date;"""

QUERY_ATTRIBUTES_FILLED_TREND = """WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
),
-- Query to count attributes filled in each day
CompletedCounts AS (
    SELECT 
        ds.Date AS CompletionDate,
        COALESCE(COUNT(pav.Id), 0) AS FilledCount
    FROM DateSeries ds
    LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON DATE(pav.UpdatedAt) = ds.Date and pav.ProjectId in (select projectid from cleantranscrm.Project p where ProgramId = 16) 
    WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
    GROUP BY ds.Date
    ORDER BY ds.Date
),
-- Calculate the average count for the first half of the 30-day period
FirstHalf AS (
    SELECT AVG(FilledCount) AS AvgFirstHalf
    FROM CompletedCounts
    WHERE CompletionDate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() - INTERVAL 16 DAY
),
-- Calculate the average count for the second half of the 30-day period
SecondHalf AS (
    SELECT AVG(FilledCount) AS AvgSecondHalf
    FROM CompletedCounts
    WHERE CompletionDate BETWEEN CURDATE() - INTERVAL 15 DAY AND CURDATE()
)
-- Determine the trend based on the averages
SELECT 
    CASE 
        WHEN sh.AvgSecondHalf > fh.AvgFirstHalf THEN 'up'
        WHEN sh.AvgSecondHalf < fh.AvgFirstHalf THEN 'down'
        ELSE 'neutral'
    END AS Trend,
    CASE 
        WHEN fh.AvgFirstHalf = 0 THEN 0
        ELSE ROUND(((sh.AvgSecondHalf - fh.AvgFirstHalf) / fh.AvgFirstHalf) * 100, 2)
    END AS PercentageChange
FROM FirstHalf fh, SecondHalf sh;"""

QUERY_SERVICES_COMPLETED = """WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
)
SELECT 
    ds.Date AS CompletionDate,
    COALESCE(COUNT(DISTINCT CONCAT(pav.projectid, '-', pav.ProgramAttributeId)), 0) AS CompletedCount
FROM DateSeries ds
LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Complete'
LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId AND DATE(pav.Value) = ds.Date AND pav.ProgramAttributeId not in (select programattributeid from cleantranscrm.TeasServiceType)
WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
GROUP BY ds.Date
ORDER BY ds.Date;"""

QUERY_SERVICES_COMPLETED_TREND = """-- Generate a series of dates for the past 30 days
WITH RECURSIVE DateSeries AS (
    SELECT CURDATE() AS Date
    UNION ALL
    SELECT Date - INTERVAL 1 DAY
    FROM DateSeries
    WHERE Date > CURDATE() - INTERVAL 29 DAY
),
-- Query to count completed services each day
CompletedCounts AS (
    SELECT 
        ds.Date AS CompletionDate,
        COALESCE(COUNT(DISTINCT CONCAT(pav.projectid, '-', pav.ProgramAttributeId)), 0) AS CompletedCount
    FROM DateSeries ds
    LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramId = 16 AND pa.ControlType = 'date' AND pa.label = 'Complete'
    LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId AND DATE(pav.Value) = ds.Date AND pav.ProgramAttributeId not in (select programattributeid from cleantranscrm.TeasServiceType)
    WHERE ds.Date >= CURDATE() - INTERVAL 30 DAY
    GROUP BY ds.Date
    ORDER BY ds.Date
),
-- Calculate the average count for the first half of the 30-day period
FirstHalf AS (
    SELECT AVG(CompletedCount) AS AvgFirstHalf
    FROM CompletedCounts
    WHERE CompletionDate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() - INTERVAL 16 DAY
),
-- Calculate the average count for the second half of the 30-day period
SecondHalf AS (
    SELECT AVG(CompletedCount) AS AvgSecondHalf
    FROM CompletedCounts
    WHERE CompletionDate BETWEEN CURDATE() - INTERVAL 15 DAY AND CURDATE()
)
-- Determine the trend based on the averages and calculate the percentage change
SELECT 
    CASE 
        WHEN sh.AvgSecondHalf > fh.AvgFirstHalf THEN 'up'
        WHEN sh.AvgSecondHalf < fh.AvgFirstHalf THEN 'down'
        ELSE 'neutral'
    END AS Trend,
    CASE 
        WHEN fh.AvgFirstHalf = 0 THEN 0
        ELSE ROUND(((sh.AvgSecondHalf - fh.AvgFirstHalf) / fh.AvgFirstHalf) * 100, 2)
    END AS PercentageChange
FROM FirstHalf fh, SecondHalf sh;"""

QUERY_PROJECT_SERVICE_ATTRIBUTES = """SELECT 
        p.ProjectNumber,
        p.ProjectId,
        pal.PhaseId,
        pp.Name AS ServiceName,
        pal.ControlName,
        pal.ControlType,
        pal.Label,
        pal.Description,
        COALESCE(pal.IsGatingItem,0) AS IsGatingItem,
        CASE 
            WHEN A.DisplayName IS NULL THEN PR.ProperName
            ELSE A.DisplayName 
        END AS 'DisplayName',
        pal.Value,
        pal.UpdatedAt,
        pal.UpdatedBy,
        PR.Initials
    FROM 
        (SELECT 
            p.ProjectId, 
            p.CurrentPhaseId AS CurrentProjectPhase, 
            a.ProgramAttributeId, 
            a.ProgramId, 
            a.PhaseId, 
            a.SortOrder, 
            a.ControlName, 
            a.ControlType, 
            a.ValueType, 
            a.ReadOnly, 
            a.Source, 
            a.Required, 
            a.Label, 
            a.Description, 
            a.IsGatingItem, 
            a.IsDocument, 
            a.AssignedUserUserId, 
            a.TableId, 
            v.Value, 
            v.UpdatedAt, 
            v.UpdatedBy 
        FROM 
            cleantranscrm.ProgramAttribute AS a 
        INNER JOIN
            cleantranscrm.Project AS p ON a.ProgramId = p.ProgramId 
        LEFT OUTER JOIN
            cleantranscrm.ProjectAttributeValue AS v ON v.ProgramAttributeId = a.ProgramAttributeId AND v.ProjectId = p.ProjectId
        ) pal
    LEFT JOIN 
        cleantranscrm.Project p ON p.ProjectId = pal.ProjectId
    LEFT JOIN 
        (SELECT 
            pa.ProgramAttributeid,
            pa.AssignedUserUserId,
            u.DisplayName
        FROM 
            cleantranscrm.ProgramAttribute pa
        LEFT JOIN 
            cleantranscrm.`User` u ON u.UserId = pa.AssignedUserUserId
        ) A ON A.ProgramAttributeId = pal.ProgramAttributeId
    LEFT JOIN 
        (SELECT 
            pr.ProjectId, 
            u.DisplayName,
            u.Initials,
            u.ProperName 
        FROM 
            cleantranscrm.ProjectRole pr 
        LEFT JOIN 
            cleantranscrm.`User` u ON pr.UserId = u.UserId
        ) PR ON PR.ProjectId = p.ProjectId
    LEFT JOIN 
        cleantranscrm.ProgramPhase pp ON pal.PhaseId = pp.PhaseId AND pal.ProgramId = pp.ProgramId
    LEFT JOIN 
        (SELECT 
            pal.ProjectId,
            pal.Label
        FROM 
            (SELECT 
                p.ProjectId, 
                p.CurrentPhaseId AS CurrentProjectPhase, 
                a.ProgramAttributeId, 
                a.ProgramId, 
                a.PhaseId, 
                a.SortOrder, 
                a.ControlName, 
                a.ControlType, 
                a.ValueType, 
                a.ReadOnly, 
                a.Source, 
                a.Required, 
                a.Label, 
                a.Description, 
                a.IsGatingItem, 
                a.IsDocument, 
                a.AssignedUserUserId, 
                a.TableId, 
                v.Value, 
                v.UpdatedAt, 
                v.UpdatedBy 
            FROM 
                cleantranscrm.ProgramAttribute AS a 
            INNER JOIN
                cleantranscrm.Project AS p ON a.ProgramId = p.ProgramId 
            LEFT OUTER JOIN
                cleantranscrm.ProjectAttributeValue AS v ON v.ProgramAttributeId = a.ProgramAttributeId AND v.ProjectId = p.ProjectId
            ) pal
        LEFT JOIN 
            cleantranscrm.Project p ON p.ProjectId = pal.ProjectId
        WHERE 
            pal.ProgramId = 16 
            AND pal.PhaseId = 2
            AND p.Deleted = 0
            AND pal.Value = 'True'
        ) svc ON pp.Name = svc.Label AND pal.ProjectId = svc.ProjectId
    WHERE 
        1=1
        AND pal.ProgramId = 16
        AND p.Deleted = 0
        AND pal.Required = 1
        AND (svc.Label IS NOT NULL OR pal.PhaseId = 0)
        AND p.ProjectId NOT IN (3467)
        AND p.ProjectId = %(projectId)s AND pp.Name LIKE %(serviceName)s
    ORDER BY
        p.ProjectId ASC, pal.SortOrder ASC;"""

QUERY_PROJECT_SERVICE = """SELECT
        p.ProjectNumber,
        p.ProjectId,
        tst2.Name as 'CoreName',
        pa.Label AS ServiceName,
        CASE
            WHEN pa.ControlType = 'select' THEN so.OptionText
            WHEN pal.Value IS NULL THEN 'False'
            ELSE pal.Value
        END AS AttributeValue,
        A.Value AS 'ServiceStartDate',
        B.Value as 'FollowUpDate',
        C.Value as 'CompleteDate'
    FROM cleantranscrm.TeasSupportType tst
    LEFT JOIN cleantranscrm.TeasServiceType tst2 on CAST(tst2.TeasServiceTypeId AS UNSIGNED) = CAST(tst.TeasServiceTypeId AS UNSIGNED)
    LEFT JOIN cleantranscrm.ProjectAttributeValue pal ON pal.ProgramAttributeId = CAST(tst.ProgramAttributeId AS UNSIGNED)
    LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramAttributeId = pal.ProgramAttributeId
    LEFT JOIN cleantranscrm.`Project` p ON p.ProjectId = pal.ProjectId
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
    WHERE
        pal.ProjectId IN (SELECT ProjectId FROM cleantranscrm.`Project` WHERE ProgramId = 16)
        AND pa.PhaseId = 2 AND pa.ProgramId = 16 AND pal.Value='True'
    GROUP BY p.ProjectNumber, tst2.Name, pa.Label
    ORDER BY
        p.ProjectNumber ASC, pp.SortOrder ASC, pa.SortOrder ASC;"""

QUERY_PROJECT_TIMELINE = """SELECT ptv.*, 
       pa.Label, 
       pa.SortOrder AS 'LabelSortOrder', 
       pp.Name AS 'PhaseName', 
       pp.SortOrder AS 'PhaseSortOrder'
FROM cleantranscrm.ProjectAttributeValue ptv
LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramAttributeId = ptv.ProgramAttributeId
LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = pa.PhaseId AND pp.ProgramId = pa.ProgramId
WHERE ptv.projectid = 30
  AND ptv.ProgramAttributeId IN (SELECT ProgramAttributeId 
                                 FROM cleantranscrm.ProgramAttribute 
                                 WHERE ControlType = 'date');"""

QUERY_MILESTONE_DATES = """
    SELECT
        p.ProjectNumber,
        p.ProjectId,
        p.Name as 'ProjectName',
        o.Name AS 'OrganizationName',
        o.OrganizationId,
        pa.PhaseId,
        pp.Name as 'PhaseName',
        pa.Label AS 'DateName',
        pal.Value,
        pal.UpdatedBy,
        pal.UpdatedAt 
    FROM cleantranscrm.ProjectAttributeValue pal
    LEFT JOIN cleantranscrm.ProgramAttribute pa ON pa.ProgramAttributeId = pal.ProgramAttributeId
    LEFT JOIN cleantranscrm.`Project` p ON p.ProjectId = pal.ProjectId
    LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId 
    LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.PhaseId = pa.PhaseId AND pp.ProgramId = pa.ProgramId
    WHERE pa.ControlType = 'date'
    and p.ProjectId = %(projectId)s
    GROUP BY p.ProjectNumber, pa.Label
    Order by p.ProjectId asc, pal.UpdatedAt desc;
"""

QUERY_CURRENT_PHASE_ATTRIBUTES = """
    SELECT 
        p.ProjectId,
        pa.Label,
        pa.ControlType,
        pa.Required,
        pa.SortOrder,
        CASE
            WHEN pa.ControlType = 'select' THEN so.OptionText
            WHEN pav.Value IS NULL THEN NULL
            ELSE pav.Value
        END AS AttributeValue,
        pav.UpdatedAt,
        pav.UpdatedBy,
        pp.Name AS 'PhaseName',
        pa.ProgramAttributeId,
        CASE 
            WHEN pa.AssignedUserUserId IS NOT NULL THEN (select u.ProperName from cleantranscrm.`User` u where u.UserId = pa.AssignedUserUserId)
            ELSE u.ProperName 
        END AS 'AssignedUser'
    FROM cleantranscrm.ProgramAttribute pa
    LEFT JOIN cleantranscrm.ProjectAttributeValue pav ON pav.ProgramAttributeId = pa.ProgramAttributeId AND pav.ProjectId = %(projectId)s
    LEFT JOIN cleantranscrm.Project p ON p.ProjectId = %(projectId)s AND pa.ProgramId = p.ProgramId
    LEFT JOIN cleantranscrm.ProgramPhase pp ON pp.ProgramId = pa.ProgramId AND pp.PhaseId = pa.PhaseId
    LEFT JOIN cleantranscrm.ProjectRole pr ON pr.ProjectId = p.ProjectId
    LEFT JOIN cleantranscrm.Organization o ON o.OrganizationId = p.OrganizationId
    LEFT JOIN cleantranscrm.SelectOption so ON pa.Source = so.SelectControlId
        AND pa.ControlType = 'select'
        AND CAST(pav.Value AS UNSIGNED) = so.OptionValue
    LEFT JOIN cleantranscrm.`User` u ON u.UserId = pr.UserId AND pr.RoleId = 1
    WHERE pa.PhaseId = p.CurrentPhaseId
    AND p.ProjectId = %(projectId)s
    ORDER BY pa.SortOrder ASC;
"""



# Dictionary mapping query names to their SQL strings
QUERIES = {
    'summary': QUERY_SUMMARY,
    'duration': QUERY_DURATION,
    'projects': QUERY_PROJECTS,
    'projects-trend': QUERY_PROJECTS_TREND,
    'logged-activities': QUERY_LOGGED_ACTIVITIES,
    'logged-activities-trend': QUERY_LOGGED_ACTIVITIES_TREND,
    'attributes-filled': QUERY_ATTRIBUTES_FILLED,
    'attributes-filled-trend': QUERY_ATTRIBUTES_FILLED_TREND,
    'services-completed': QUERY_SERVICES_COMPLETED,
    'services-completed-trend': QUERY_SERVICES_COMPLETED_TREND,
    'project-service-attributes': QUERY_PROJECT_SERVICE_ATTRIBUTES,
    'project-service': QUERY_PROJECT_SERVICE,
    'project-timeline': QUERY_PROJECT_TIMELINE,
    'logged-time': QUERY_LOGGED_TIME,
    'logged-time-trend': QUERY_LOGGED_TIME_TREND,
    'project-milestone-dates': QUERY_MILESTONE_DATES,
    'current-phase-attributes': QUERY_CURRENT_PHASE_ATTRIBUTES,
    # ... add other queries with descriptive names
}