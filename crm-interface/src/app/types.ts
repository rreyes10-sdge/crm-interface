export interface VehicleGroup {
    id: number;
    vehicleClass: string;
    numVehicles: number;
    avgDailyMileage: number;
}

export interface ChargerGroup {
    id: number;
    numChargers: number;
    chargerKW: number;
}

export interface OptionalSettings {
    fossilFuelPrice?: number;
    fossilFuelMultiplier?: number;
    fossilFuelEfficiency?: number;
    transformerCapacity?: number;
}

export interface ProjectSite {
    vehicle_acquisition_costs?: number;
    vehicle_maintenance_repair_costs?: number;
    vehicle_insurance_costs?: number;
    charger_installation_costs?: number;
    charger_maintenance_repair_network_costs?: number;
    vehicle_incentive_credits?: number;
    charger_incentive_credits?: number;
    fossil_vehicle_acquisition_costs?: number;
    fossil_vehicle_maintenance_repair_costs?: number;
    fossil_vehicle_insurance_costs?: number;
}

export interface CalculationResults {
    average_yearly_savings: number;
    totalCost: number;
    paybackPeriod: number;
    co2Reduction: number;
    fossil_fuel_daily_avg_cost: number;
    fossil_fuel_weekly_avg_cost: number;
    average_mpg: number;
    daily_average_miles: number;
    daily_fossil_fuel_cost: number;
    total_monthly_ev_cost: number;
    yearly_fossil_fuel_costs: { [year: string]: number };
    yearly_ev_costs: { [year: string]: number };
    optimal_scenario: boolean;
    total_daily_charger_energy_output: number;
    total_daily_vehicle_energy_needed: number;
    unmanaged_scenario: boolean;
}

export interface Results {
    vehicleGroups: VehicleGroup[];
    chargerGroups: ChargerGroup[];
    projectSite: ProjectSite[];
    settings: OptionalSettings;
    calculations: CalculationResults | null;
}

export interface ChargingBehavior {
    days: string[];
    startTime: string;
    endTime: string;
} 

export interface ProjectServiceAttributes {
    projectId: number;
    projectNumber: string;
    organizationName: string;
    coreName: string;
    serviceName: string;
    ControlType: string;
    Label: string;
    Value: string;
    Description: string;
    Initials: string;
}