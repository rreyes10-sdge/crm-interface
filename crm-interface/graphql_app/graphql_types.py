class ProjectOverviewType:
    def __init__(self, project_number, project_name, total_services_selected, services_completed, open_services, percent_completed):
        self.project_number = project_number
        self.project_name = project_name
        self.total_services_selected = total_services_selected
        self.services_completed = services_completed
        self.open_services = open_services
        self.percent_completed = percent_completed