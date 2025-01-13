type_defs = """
    type ProjectOverview {
        projectNumber: String
        programId: Int
        projectId: Int
        projectName: String
        organizationName: String
        organizationId: Int
        projectStatus: String
        projectLead: String
        usc: String
        totalServicesSelected: Int
        servicesCompleted: Int
        servicesInProgress: Int
        openServices: Int
        servicesNotReady: Int
        percentCompleted: Float
    }

    type ProjectDetails {
        projectNumber: String
        projectId: Int
        phaseId: Int
        organizationName: String
        organizationId: Int
        coreName: String
        serviceName: String
        serviceStartDate: String
        followUpDate: String
        completeDate: String
        totalDurationMins: Int
        latestActivity: String
        createdAt: String
        totalRequired: Int
        filledCount: Int
    }

    type ProjectTimeline {
        id: Int
        projectId: Int
        programAttributeId: Int
        updatedAt: String
        label: String
        updatedBy: String
        phaseName: String
        phaseSortOrder: Int
        labelSortOrder: Int
    }

    type Query {
        projectOverview(
            programId: Int
            projectName: String
            projectNumber: String
            projectStatus: String
            organizationName: String
        ): [ProjectOverview]

        projectsWithFollowUpDates: [ProjectDetails]
        servicesStarted: [ProjectDetails]
        projectsNotStarted: [ProjectDetails]
        completedProjects: [ProjectDetails]
        
        projectTimeline(
            projectId: Int
        ): [ProjectTimeline]

    }
"""