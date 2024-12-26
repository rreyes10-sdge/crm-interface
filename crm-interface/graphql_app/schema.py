type_defs = """
    type ProjectOverview {
        projectNumber: String
        projectName: String
        totalServicesSelected: Int
        servicesCompleted: Int
        openServices: Int
        percentCompleted: Float
        programId: Int
        status: String
        organizationName: String
    }

    type Query {
        projectOverview(
            programId: Int
            projectName: String
            projectNumber: String
            status: String
            organizationName: String
        ): [ProjectOverview]
    }
"""