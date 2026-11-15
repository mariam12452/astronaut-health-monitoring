# AstroVitals: Astronaut Health Monitoring and Decision Support System

## 1. Project Overview

AstroVitals is a software-based health monitoring and decision-support prototype developed for the 2026 NASA Space Apps Challenge.

The project addresses the need for continuous and organised monitoring of astronauts' physiological health during space missions. Spaceflight exposes astronauts to physiological changes that can affect multiple body systems, making the collection, interpretation and tracking of health measurements important.

AstroVitals proposes a unified platform for organising physiological measurements, monitoring changes over time, comparing readings against individual baselines and highlighting deviations that may require attention.

## 2. Problem Statement

Astronauts experience physiological adaptations during spaceflight, particularly during prolonged exposure to microgravity. These changes can affect cardiovascular function, fluid distribution, respiratory health, vision and musculoskeletal integrity.

Monitoring these physiological changes is essential for understanding an astronaut's health status and supporting timely medical assessment.

However, physiological measurements may originate from different monitoring devices, investigations and data sources. Organising these measurements into an accessible system for tracking and interpretation presents an important challenge.

AstroVitals aims to address this challenge through a centralised health-monitoring interface.

## 3. Proposed Solution

AstroVitals is designed to bring multiple physiological health indicators into one monitoring platform.

The proposed system aims to:

- Organise physiological measurements from different sources.
- Display individual health readings.
- Maintain historical measurement records.
- Compare readings against individual baseline values.
- Track physiological changes over time.
- Identify unusual or persistent deviations.
- Present monitoring statuses and relevant information to support follow-up decisions.

## 4. Health Parameters

The project's agreed monitoring scope includes ten health parameters:

| Parameter | Description |
|---|---|
| Blood Pressure | Measurement of arterial blood pressure. |
| Blood Oxygen Saturation (SpO2) | Estimation of oxygen saturation in the blood. |
| Blood Glucose | Measurement of glucose concentration in the blood. |
| Heart Rate | Number of heartbeats per minute. |
| Respiratory Rate | Number of breathing cycles per minute. |
| Activity level | Assessment of an astronaut activity level, including activity intensity and movement. |
| Internal Jugular Vein (IJV) Area and Flow Grade | Assessment of internal jugular vein dimensions and blood-flow characteristics. |
| Optic Nerve Sheath Diameter (ONSD) | Ultrasound-based measurement associated with assessing changes in intracranial pressure. |
| Carotid Intima-Media Thickness (cIMT) | Measurement of the thickness of the inner layers of the carotid artery wall. |
| Left Ventricular Ejection Fraction (LVEF) | Assessment of the proportion of blood ejected by the left ventricle during contraction. |
| Lower-Limb Muscle Thickness | Measurement used to assess changes in lower-limb muscle structure. |

These parameters represent the team's agreed project scope. They may require different measurement technologies, acquisition methods and collection frequencies.

## 5. Data Sources and Simulation
The proposed system is designed to receive health measurements from multiple sources. These may include wearable monitoring devices, separate medical measurement technologies, scheduled clinical assessments and simulated data used during prototype development.

5.1 Data Sources
The project considers the following sources:
Data Source	Purpose
Canadian Space Agency (CSA) Bio-Monitor	Provides a reference for wearable physiological monitoring in space, including heart rate, blood pressure, breathing, oxygen saturation and physical activity.
Hexoskin/Astroskin documentation	Provides technical reference material on wearable sensor data, data formats and possible software integration approaches.
Separate medical measurement technologies	Represent the additional equipment required for parameters not documented as Bio-Monitor measurements, including ultrasound-based cardiovascular and ocular assessments.
Simulated data	Provides sample measurements for developing and testing the application's data-processing, storage, monitoring and visualisation functions.


5.2 Data Simulation
During prototype development, simulated health measurements may be used to demonstrate how the application receives, processes, stores and displays astronaut health information.

Each simulated record will contain relevant information such as:
- Astronaut identifier
- Measurement timestamp
- Health parameter
- Recorded value
- Unit of measurement
- Data source
- Measurement quality or status, where applicable
An example of a simulated measurement record is shown below:
{
  "astronaut_id": "AST001",
  "timestamp": "2026-11-14T10:00:00Z",
  "parameter": "spo2",
  "value": 98,
  "unit": "%",
  "source": "simulated"
}

The values used in simulated records are illustrative and are not actual astronaut measurements or clinically validated reference values.

5.3 Data Integration Considerations
The project recognises that the selected health parameters require different measurement technologies and data acquisition methods.

Not all parameters are measured by a single wearable device. Therefore, the proposed system is designed to accommodate measurements from multiple sources through a common data-processing structure.

The application will aim to:
- Receive measurements from available data sources or simulated inputs.
- Organise incoming measurements into a consistent data format.
- Associate each measurement with an astronaut and timestamp.
- Validate incoming records before processing.
- Store measurements for historical review and trend analysis.
Direct integration with operational spaceflight monitoring hardware will depend on the availability of compatible interfaces, access permissions and technical documentation.

5.4 Scope of Current Data
At the prototype stage, simulated data will be used where actual device data or compatible interfaces are unavailable.

The use of simulated data allows the team to demonstrate the application's intended functionality without presenting generated measurements as real astronaut health records.

## 6. System Architecture
The proposed astronaut health-monitoring system follows a modular architecture designed to receive, process, store, analyse and display physiological measurements from multiple data sources.

The architecture separates data acquisition, processing, storage, monitoring and visualisation to support easier development, testing and future integration with additional monitoring devices.

6.1 System Workflow
The proposed data flow is:
1. Data Sources: Health measurements are obtained from available monitoring devices, separate medical measurement technologies or simulated data generators.
2. Data Ingestion: Incoming measurements are received by the application through an appropriate input interface or API.
3. Data Validation and Normalisation: The system checks incoming records for required fields, valid formats, units, timestamps and data quality. Measurements are organised into a consistent structure.
4. Data Storage: Validated measurements are stored with their associated astronaut identifiers, timestamps, parameter names, values and units.
5. Health Monitoring Engine: The system evaluates measurements against defined reference information and, where available, individual astronaut baselines. It also considers relevant context, such as activity level and changes over time.
6. Dashboard and Visualisation: Processed information is presented through a dashboard showing current readings, historical trends, monitoring statuses and relevant explanations.

6.2      HEALTH DATA SOURCES
  ┌──────────┬──────────┬──────────┐
  │ Wearable │ Medical  │ Simulated│
  │ Devices  │ Equipment│  Data   │
  └────┬─────┴────┬─────┴────┬─────┘
       └──────────┼──────────┘
                  ↓
        DATA INGESTION (API / Input Interface)
                  ↓
   DATA VALIDATION AND NORMALISATION
                  ↓
             DATA STORAGE
                  ↓
        HEALTH MONITORING ENGINE
                  ↓
       DASHBOARD AND VISUALISATION
                  ↓
       HEALTH STATUS AND TREND REPORTS

6.3 Core System Components
| Component | Responsibility |
|---|---|
| Data Acquisition Layer	| Receives measurements from available devices, medical sources or simulated inputs. |
| Data Ingestion Interface	| Provides the entry point through which measurement records enter the application. |
| Validation and Normalisation Layer	| Checks data completeness, formats, units, timestamps and measurement quality. |
| Database	| Stores health measurements and associated astronaut information for retrieval and analysis. | 
| Health Monitoring Engine |	Evaluates measurements, compares them with available baselines and identifies relevant changes or deviations. |
| Dashboard	| Displays health measurements, monitoring statuses, historical trends and explanations. |

6.4 Monitoring and Alert Generation
The monitoring engine is intended to evaluate health measurements using defined monitoring rules.

Rather than relying exclusively on fixed population reference values, the proposed system will consider individual baselines and relevant activity context where sufficient data are available.

The prototype will use understandable monitoring categories:
- NORMAL: No significant deviation identified by the configured monitoring rules.
- WATCH: A measurement or trend requires closer observation.
- ATTENTION: A notable deviation or persistent change requires further review.
Each status should be accompanied by an explanation of the measurement or trend that triggered it.

These categories represent prototype decision-support outputs. They are not clinically validated diagnoses or emergency medical classifications.
6.5 Design Considerations
The architecture is designed around the following considerations:
- Multiple data sources: The system should accommodate measurements obtained through different devices and technologies.
- Data consistency: Measurements should follow a common structure while retaining their original units and source information.
- Individual monitoring: Health trends should be interpreted in relation to available individual baseline measurements.
- Activity context: Physical activity should be considered when interpreting relevant physiological changes.
- Historical tracking: Measurements should be stored to support trend analysis over time.
- Data quality: Missing, outdated or unreliable measurements should be identified rather than automatically classified as normal.
- Modularity: Components should be designed so that additional data sources and monitoring capabilities can be incorporated later.

## 7. Project Development Status

AstroVitals is a prototype developed for the 2026 NASA Space Apps Challenge.

The current implementation and the status of individual features will be documented as development progresses.

Features that are proposed but not yet implemented will be distinguished from working components.

## 8. Limitations

The current project has the following limitations:

- The prototype uses simulated physiological readings.
- It is not connected to live astronaut medical monitoring systems.
- Direct integration with the International Space Station Bio-Monitor has not been established.
- The monitoring logic and thresholds are not clinically validated.
- The system is not intended to diagnose medical conditions or replace professional medical judgement.

## 9. Future Development

Potential future improvements include:

- Integration with compatible physiological monitoring devices.
- Incorporation of accessible spaceflight research datasets.
- Improved individual baseline modelling.
- Enhanced historical trend analysis.
- Further testing and validation of monitoring algorithms.
- Improved interoperability with external health-monitoring systems.

## 10. Challenge Information

**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions.

**Event:** NASA Space Apps Challenge 2026.

## 11. Team

[Insert team name and team members.]

## 12. Acknowledgements and References

The project draws on scientific research and technical documentation relating to astronaut health monitoring and wearable physiological measurement systems.

Detailed references, resource descriptions and their relevance to the project will be documented in the `docs/` directory.

