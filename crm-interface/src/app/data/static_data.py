# Define fossil fuel MPG mapping
fossil_fuel_mpg_mapping = {
    "Heavy Duty Pickup & Van - Class 2B": {"mpg": 15.1, "mile_per_kwh": 1.09},
    "Heavy Duty Pickup & Van - Class 3": {"mpg": 11.5, "mile_per_kwh": 1.09},
    "Shuttle Bus - Class 3-5": {"mpg": 6.06, "mile_per_kwh": 2.06},
    "Delivery Van - Class 3-5": {"mpg": 10.5, "mile_per_kwh": 1.19},
    "Service Van - Class 3-5": {"mpg": 10.5, "mile_per_kwh": 1.19},
    "Box Truck (Freight) - Class 3-5": {"mpg": 11.5, "mile_per_kwh": 1.09},
    "Stake Truck - Class 3-5": {"mpg": 10.5, "mile_per_kwh": 1.19},
    "Stake Truck - Class 6-7": {"mpg": 8.1, "mile_per_kwh": 1.55},
    "Box Truck (Freight) - Class 6-7": {"mpg": 8.7, "mile_per_kwh": 1.44},
    "Delivery Truck - Class 6-7": {"mpg": 8.1, "mile_per_kwh": 1.55},
    "Service Truck - Class 6-7": {"mpg": 8.1, "mile_per_kwh": 1.55},
    "School Bus - Class 7": {"mpg": 8.16, "mile_per_kwh": 1.53},
    "Regional Haul Tractor - Class 7-8": {"mpg": 5.85, "mile_per_kwh": 2.14},
    "Box Truck (Freight) - Class 8": {"mpg": 7.5, "mile_per_kwh": 1.67},
    "Long Haul Tractor - Class 8": {"mpg": 5.83, "mile_per_kwh": 2.15},
    "Transit Bus - Class 8": {"mpg": 6.19, "mile_per_kwh": 2.02},
    "Refuse Hauler - Class 8": {"mpg": 5.72, "mile_per_kwh": 2.19},
    "Dump Truck - Class 8": {"mpg": 6.9, "mile_per_kwh": 1.81}
}

TOU_DATA = {
    "TOU": {
        "Weekdays": {
            "Summer": {
                "On-Peak": "16:00-21:00",
                "Off-Peak": ["06:00-16:00", "21:00-00:00"],
                "Super Off-Peak": "00:00-06:00"
            },
            "Winter": {
                "On-Peak": "16:00-21:00",
                "Off-Peak": ["06:00-16:00", "21:00-00:00"],
                "Super Off-Peak": "00:00-06:00"
            }
        },
        "WeekendsAndHolidays": {
            "Summer": {
                "On-Peak": "16:00-21:00",
                "Off-Peak": ["14:00-16:00", "21:00-00:00"],
                "Super Off-Peak": "00:00-14:00"
            },
            "Winter": {
                "On-Peak": "16:00-21:00",
                "Off-Peak": ["14:00-16:00", "21:00-00:00"],
                "Super Off-Peak": "00:00-14:00"
            }
        }
    },
    "Seasons": {
        "Summer": "June 1 - October 31",
        "Winter": "November 1 - May 31"
    },
    "TOU_Rates": {
        "2025": {
            "ServiceFee": {
                "ServiceFeeLess": 213.3,
                "ServiceFeeMore": 766.91
            },
            "SubscriptionFee": {
                "SubscriptionFeeLess": 54.62,
                "SubscriptionFeeMore": 136.56
            },
            "Weekdays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.27730
                    },
                    "Off-Peak": {
                        "Total": 0.11734
                    },
                    "Super_Off-Peak": {
                        "Total": 0.10789
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.28762
                    },
                    "Off-Peak": {
                        "Total": 0.11734
                    },
                    "Super_Off-Peak": {
                        "Total": 0.10304
                    }
                }
            },
            "WeekendsAndHolidays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.27730
                    },
                    "Off-Peak": {
                        "Total": 0.11734
                    },
                    "Super_Off-Peak": {
                        "Total": 0.10789
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.28762
                    },
                    "Off-Peak": {
                        "Total": 0.11734
                    },
                    "Super_Off-Peak": {
                        "Total": 0.10304
                    }
                }
            }
        },
        "2026": {
            "ServiceFee": {
                "ServiceFeeLess": 213.3,
                "ServiceFeeMore": 766.91
            },
            "SubscriptionFee": {
                "SubscriptionFeeLess": 67.58,
                "SubscriptionFeeMore": 168.97
            },
            "Weekdays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.29271
                    },
                    "Off-Peak": {
                        "Total": 0.12560
                    },
                    "Super_Off-Peak": {
                        "Total": 0.11533
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.30320
                    },
                    "Off-Peak": {
                        "Total": 0.12610
                    },
                    "Super_Off-Peak": {
                        "Total": 0.10981
                    }
                }
            },
            "WeekendsAndHolidays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.29271
                    },
                    "Off-Peak": {
                        "Total": 0.12560
                    },
                    "Super_Off-Peak": {
                        "Total": 0.11533
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.30320
                    },
                    "Off-Peak": {
                        "Total": 0.12610
                    },
                    "Super_Off-Peak": {
                        "Total": 0.10981
                    }
                }
            }
        },
        "2027": {
            "ServiceFee": {
                "ServiceFeeLess": 213.3,
                "ServiceFeeMore": 766.91
            },
            "SubscriptionFee": {
                "SubscriptionFeeLess": 80.54,
                "SubscriptionFeeMore": 201.38
            },
            "Weekdays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.30812
                    },
                    "Off-Peak": {
                        "Total": 0.13532
                    },
                    "Super_Off-Peak": {
                        "Total": 0.12278
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.31877
                    },
                    "Off-Peak": {
                        "Total": 0.13486
                    },
                    "Super_Off-Peak": {
                        "Total": 0.11658
                    }
                }
            },
            "WeekendsAndHolidays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.30812
                    },
                    "Off-Peak": {
                        "Total": 0.13532
                    },
                    "Super_Off-Peak": {
                        "Total": 0.12278
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.31877
                    },
                    "Off-Peak": {
                        "Total": 0.13486
                    },
                    "Super_Off-Peak": {
                        "Total": 0.11658
                    }
                }
            }
        },
        "2028": {
            "ServiceFee": {
                "ServiceFeeLess": 213.3,
                "ServiceFeeMore": 766.91
            },
            "SubscriptionFee": {
                "SubscriptionFeeLess": 93.50,
                "SubscriptionFeeMore": 233.79
            },
            "Weekdays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.32353
                    },
                    "Off-Peak": {
                        "Total": 0.14504
                    },
                    "Super_Off-Peak": {
                        "Total": 0.13023
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.33434
                    },
                    "Off-Peak": {
                        "Total": 0.14362
                    },
                    "Super_Off-Peak": {
                        "Total": 0.12335
                    }
                }
            },
            "WeekendsAndHolidays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.32353
                    },
                    "Off-Peak": {
                        "Total": 0.14504
                    },
                    "Super_Off-Peak": {
                        "Total": 0.13023
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.33434
                    },
                    "Off-Peak": {
                        "Total": 0.14362
                    },
                    "Super_Off-Peak": {
                        "Total": 0.12335
                    }
                }
            }
        },
        "2029": {
            "ServiceFee": {
                "ServiceFeeLess": 213.3,
                "ServiceFeeMore": 766.91
            },
            "SubscriptionFee": {
                "SubscriptionFeeLess": 106.46,
                "SubscriptionFeeMore": 266.20
            },
            "Weekdays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.33894
                    },
                    "Off-Peak": {
                        "Total": 0.15476
                    },
                    "Super_Off-Peak": {
                        "Total": 0.13768
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.34991
                    },
                    "Off-Peak": {
                        "Total": 0.15238
                    },
                    "Super_Off-Peak": {
                        "Total": 0.13012
                    }
                }
            },
            "WeekendsAndHolidays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.33894
                    },
                    "Off-Peak": {
                        "Total": 0.15476
                    },
                    "Super_Off-Peak": {
                        "Total": 0.13768
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.34991
                    },
                    "Off-Peak": {
                        "Total": 0.15238
                    },
                    "Super_Off-Peak": {
                        "Total": 0.13012
                    }
                }
            }
        },
        "2030": {
            "ServiceFee": {
                "ServiceFeeLess": 213.3,
                "ServiceFeeMore": 766.91
            },
            "SubscriptionFee": {
                "SubscriptionFeeLess": 119.42,
                "SubscriptionFeeMore": 298.61
            },
            "Weekdays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.35435
                    },
                    "Off-Peak": {
                        "Total": 0.16448
                    },
                    "Super_Off-Peak": {
                        "Total": 0.14513
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.36548
                    },
                    "Off-Peak": {
                        "Total": 0.16114
                    },
                    "Super_Off-Peak": {
                        "Total": 0.13689
                    }
                }
            },
            "WeekendsAndHolidays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.35435
                    },
                    "Off-Peak": {
                        "Total": 0.16448
                    },
                    "Super_Off-Peak": {
                        "Total": 0.14513
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.36548
                    },
                    "Off-Peak": {
                        "Total": 0.16114
                    },
                    "Super_Off-Peak": {
                        "Total": 0.13689
                    }
                }
            }
        },
        "2031": {
            "ServiceFee": {
                "ServiceFeeLess": 213.3,
                "ServiceFeeMore": 766.91
            },
            "SubscriptionFee": {
                "SubscriptionFeeLess": 132.38,
                "SubscriptionFeeMore": 331.02
            },
            "Weekdays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.36976
                    },
                    "Off-Peak": {
                        "Total": 0.17420
                    },
                    "Super_Off-Peak": {
                        "Total": 0.15258
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.38105
                    },
                    "Off-Peak": {
                        "Total": 0.16990
                    },
                    "Super_Off-Peak": {
                        "Total": 0.14366
                    }
                }
            },
            "WeekendsAndHolidays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.36976
                    },
                    "Off-Peak": {
                        "Total": 0.17420
                    },
                    "Super_Off-Peak": {
                        "Total": 0.15258
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.38105
                    },
                    "Off-Peak": {
                        "Total": 0.16990
                    },
                    "Super_Off-Peak": {
                        "Total": 0.14366
                    }
                }
            }
        },
        "2032": {
            "ServiceFee": {
                "ServiceFeeLess": 213.3,
                "ServiceFeeMore": 766.91
            },
            "SubscriptionFee": {
                "SubscriptionFeeLess": 145.34,
                "SubscriptionFeeMore": 363.43
            },
            "Weekdays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.38517
                    },
                    "Off-Peak": {
                        "Total": 0.18392
                    },
                    "Super_Off-Peak": {
                        "Total": 0.16003
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.39662
                    },
                    "Off-Peak": {
                        "Total": 0.17866
                    },
                    "Super_Off-Peak": {
                        "Total": 0.15043
                    }
                }
            },
            "WeekendsAndHolidays": {
                "Summer": {
                    "On-Peak": {
                        "Total": 0.38517
                    },
                    "Off-Peak": {
                        "Total": 0.18392
                    },
                    "Super_Off-Peak": {
                        "Total": 0.16003
                    }
                },
                "Winter": {
                    "On-Peak": {
                        "Total": 0.39662
                    },
                    "Off-Peak": {
                        "Total": 0.17866
                    },
                    "Super_Off-Peak": {
                        "Total": 0.15043
                    }
                }
            }
        }
    }
}