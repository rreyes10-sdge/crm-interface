type_defs = """
    type ProjectOverview {
        projectNumber: String
        projectName: String
        totalServicesSelected: Int
        servicesCompleted: Int
        openServices: Int
        percentCompleted: Float
        programId: Int
    }

    type Query {
        projectOverview: [ProjectOverview]
    }
"""