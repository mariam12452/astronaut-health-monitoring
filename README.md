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

The current prototype uses simulated physiological readings to demonstrate the application's data-handling, monitoring and visualisation capabilities.

The simulated readings are illustrative and do not represent actual astronaut medical records or live measurements from an operational spaceflight monitoring device.

The project's research and design are informed by external scientific and technical resources, including:

- Canadian Space Agency Bio-Monitor documentation.
- AstroSkin wearable health-monitoring documentation.
- Hexoskin technical and developer documentation.
- Relevant spaceflight health research and scientific literature.

These resources inform the proposed monitoring approach, measurement characteristics and potential data-integration methods.

Detailed resource descriptions and their contributions will be provided in the project documentation.

## 6. System Architecture

The proposed system follows a general data-processing workflow:

Measurement Sources
        ↓
Data Acquisition
        ↓
Data Validation and Processing
        ↓
Data Storage
        ↓
Health Monitoring and Interpretation
        ↓
Dashboard and Visualisation

The architecture is designed to accommodate measurements from different sources through a common software platform.

Not all parameters are assumed to originate from a single wearable device.

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

