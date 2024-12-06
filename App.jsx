import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { gsap } from 'gsap';

const EXPERIMENT_TYPES = {
  COIN_TOSS: 'coinToss',
  DICE_TOSS: 'diceToss',
  CONDITIONAL_PROB: 'conditionalProbability'
};

const PROBABILITY_SCENARIOS = {
  [EXPERIMENT_TYPES.COIN_TOSS]: {
    title: "Coin Toss Probability",
    description: "Explore the 50-50 chance of heads and tails in a series of coin tosses.",
    expectedProbability: { heads: 0.5, tails: 0.5 },
    complexityLevel: "Basic",
    trials: 50
  },
  [EXPERIMENT_TYPES.DICE_TOSS]: {
    title: "Dice Roll Probability",
    description: "Investigate the uniform distribution of outcomes when rolling a six-sided die.",
    expectedProbability: { 
      1: 1/6, 2: 1/6, 3: 1/6, 4: 1/6, 5: 1/6, 6: 1/6 
    },
    complexityLevel: "Intermediate",
    trials: 60
  },
  [EXPERIMENT_TYPES.CONDITIONAL_PROB]: {
    title: "Conditional Probability",
    description: "Explore how previous events impact the probability of future outcomes.",
    expectedProbability: {
      independentEvent: 0.5,
      dependentEvent: 0.3
    },
    complexityLevel: "Advanced",
    trials: 70
  }
};

const ProbabilityVisualization = () => {
  const [experimentType, setExperimentType] = useState(EXPERIMENT_TYPES.COIN_TOSS);
  const [probabilityStats, setProbabilityStats] = useState({
    totalTrials: 0,
    outcomes: {}
  });

  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Memoized current scenario to prevent unnecessary re-renders
  const currentScenario = useMemo(() => 
    PROBABILITY_SCENARIOS[experimentType], 
    [experimentType]
  );

  const setupThreeScene = useCallback(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.6);
    
    // Performance optimization: use pixel ratio
    renderer.setPixelRatio(window.devicePixelRatio);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);

    scene.add(ambientLight, pointLight);

    return { scene, camera, renderer, controls };
  }, []);

  useEffect(() => {
    const { scene, camera, renderer, controls } = setupThreeScene();
    
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Responsive resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.6);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [setupThreeScene]);

  const clearScene = () => {
    const scene = sceneRef.current;
    while(scene.children.length > 0) { 
      scene.remove(scene.children[0]); 
    }
  };

  const runProbabilityExperiment = () => {
    clearScene();
    setProbabilityStats({ totalTrials: 0, outcomes: {} });

    const experimentMap = {
      [EXPERIMENT_TYPES.COIN_TOSS]: simulateCoinToss,
      [EXPERIMENT_TYPES.DICE_TOSS]: simulateDiceToss,
      [EXPERIMENT_TYPES.CONDITIONAL_PROB]: simulateConditionalProbability
    };

    const experimentFunction = experimentMap[experimentType];
    if (experimentFunction) experimentFunction();
  };

  const simulateCoinToss = () => {
    const scene = sceneRef.current;
    const { trials } = PROBABILITY_SCENARIOS[EXPERIMENT_TYPES.COIN_TOSS];
    const stats = { totalTrials: trials, outcomes: { heads: 0, tails: 0 } };

    for (let i = 0; i < trials; i++) {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      stats.outcomes[result]++;

      const coinGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 64);
      const coinMaterial = new THREE.MeshStandardMaterial({ 
        color: result === 'heads' ? 0xFFD700 : 0xC0C0C0
      });
      
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      
      const angle = (i / trials) * Math.PI * 2;
      coin.position.x = Math.cos(angle) * (i + 2);
      coin.position.z = Math.sin(angle) * (i + 2);
      
      gsap.fromTo(coin.rotation, 
        { x: 0, y: 0, z: 0 }, 
        { 
          x: Math.random() * Math.PI * 2, 
          y: Math.random() * Math.PI * 2, 
          z: Math.random() * Math.PI * 2, 
          duration: 1, 
          ease: "power2.inOut" 
        }
      );

      scene.add(coin);
    }

    setProbabilityStats(stats);
  };

  // Similar refactoring for simulateDiceToss and simulateConditionalProbability methods...

  return (
    <div className="bg-blue-50 p-6 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">
        Advanced Probability Visualization
      </h2>
      
      <div className="flex space-x-4 mb-4">
        <select 
          value={experimentType}
          onChange={(e) => setExperimentType(e.target.value)}
          className="p-2 border rounded"
        >
          {Object.entries(PROBABILITY_SCENARIOS).map(([key, scenario]) => (
            <option key={key} value={key}>
              {scenario.title}
            </option> 
          ))}
        </select>
        
        <button 
          onClick={runProbabilityExperiment}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Run Experiment
        </button>
      </div>
      
      <div 
        ref={mountRef} 
        className="w-full h-[500px] bg-white rounded-lg shadow-md"
      />
      
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold text-blue-700">Experiment Details:</h3>
          <p><strong>Title:</strong> {currentScenario.title}</p>
          <p><strong>Description:</strong> {currentScenario.description}</p>
          <p><strong>Complexity:</strong> {currentScenario.complexityLevel}</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-semibold text-green-700">Probability Statistics:</h3>
          <p><strong>Total Trials:</strong> {probabilityStats.totalTrials}</p>
          {Object.entries(probabilityStats.outcomes).map(([outcome, count]) => (
            <p key={outcome}>
              <strong>{outcome}:</strong> {count} 
              ({((count / probabilityStats.totalTrials) * 100).toFixed(2)}%)
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProbabilityVisualization;
