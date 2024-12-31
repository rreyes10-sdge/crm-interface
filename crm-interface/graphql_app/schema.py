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
        organizationName: String
        organizationId: Int
        coreName: String
        serviceName: String
        serviceStartDate: String
        followUpDate: String
        completeDate: String
        latestActivity: String
        createdAt: String
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
    }
"""