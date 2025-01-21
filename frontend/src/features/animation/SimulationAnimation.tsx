import React, { useState, useEffect, useRef } from "react";
import { Button, Progress } from "antd";
import { PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";
import { PollutantDataType, SimulationResponseType } from "../../types/SimulationResponseType";
import { NotificationProps } from "../../types/NotificationPropsType";
import { SimulationLightType } from "../../types/SimulationLightType";

type SimulationAnimationProps = {
  simulationData: SimulationResponseType;
  simulationLightData: SimulationLightType;
  selectedParameter: string;
  handleUpdate: (pollutantValues: number[]) => void;
  setNotification: (notification: NotificationProps) => void;
  setIsAnimating: (isAnimating: boolean) => void;
  className?: string
};

export const SimulationAnimation: React.FC<SimulationAnimationProps> = ({
  simulationData,
  simulationLightData,
  selectedParameter,
  handleUpdate,
  setNotification,
  setIsAnimating,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [simulationTime, setSimulationTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const snapInterval = simulationLightData.parameters.snapInterval;
  const totalSimulationTime = (totalSteps - 1) * snapInterval;



  useEffect(() => {
    if (simulationData?.pollutants?.steps) {
      const stepsLength = Object.keys(simulationData.pollutants.steps).length;
      setTotalSteps(stepsLength);
    } else {
      setNotification({
        message: "Error", 
        description: "Steps data is missing or invalid in the simulation data.", 
        type: "error",
      });
    }
  }, [simulationData, setNotification]);
  

  useEffect(() => {
    setIsAnimating(isPlaying);
  }, [isPlaying, setIsAnimating]);
  

  const startAnimation = () => {
    if (isPlaying) return;

    setIsPlaying(true);
    setCurrentStep(0);
    setSimulationTime(0);

    intervalRef.current = setInterval(() => {
      setCurrentStep((prevStep) => {
        if (prevStep >= totalSteps - 1) {
          clearInterval(intervalRef.current as NodeJS.Timeout);
          setIsPlaying(false);
          setCurrentStep(totalSteps - 1);
          setSimulationTime((totalSteps - 1) * snapInterval);
          return prevStep;
        }
        
        const currentTime = (prevStep + 1) * snapInterval;
        setSimulationTime(currentTime);
        
        return prevStep + 1;
      });
    }, 500);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (!simulationData || !selectedParameter) {
      return;
    }
  
    const stepData = simulationData.pollutants.steps[currentStep];
    const parameterValues = stepData[selectedParameter as keyof PollutantDataType];
  
    handleUpdate(parameterValues);

  }, [currentStep, simulationData, selectedParameter, handleUpdate]);

  const progressPercentage = currentStep === 0 ? 0 : 
    currentStep === totalSteps - 1 ? 100 : 
    Number(((currentStep + 1) / totalSteps * 100).toFixed(2));

    return (
      <div 
        className={`bg-white p-4 rounded-lg shadow-md z-20 ${className}`} 
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          margin: '0 auto',
          position: 'relative' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <Button
            type="primary"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={isPlaying ? stopAnimation : startAnimation}
            style={{ minWidth: '120px' }}
          >
            {isPlaying ? "Pause" : "Start"}
          </Button>
        </div>
        
        <Progress
          percent={progressPercentage}
          showInfo={false}
          status={isPlaying ? "active" : "normal"}
          style={{ marginBottom: '5px' }}
        />
        
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            minHeight: '30px'
          }}
        >
          <div style={{ fontWeight: 'bold', minWidth: '100px' }}>
            {simulationTime} sec
          </div>
          <div style={{ color: 'gray' }}>
            out of {totalSimulationTime} sec
          </div>
        </div>
      </div>
    );
};