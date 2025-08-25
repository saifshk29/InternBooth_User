import React from 'react';

const domainColors = {
  // Electronics & Communication
  'VLSI Design': 'bg-purple-200 text-purple-800',
  'VLSI': 'bg-purple-200 text-purple-800',
  'Embedded Systems': 'bg-red-200 text-red-800',
  'Embedded C': 'bg-red-200 text-red-800',
  'Embedded': 'bg-red-200 text-red-800',
  'Digital Signal Processing (DSP)': 'bg-indigo-200 text-indigo-800',
  'Control Systems': 'bg-slate-200 text-slate-800',
  'Communication Systems (Wireless, Optical, Satellite)': 'bg-sky-200 text-sky-800',
  'Antennas & Microwave Engineering': 'bg-violet-200 text-violet-800',
  'Internet of Things (IoT)': 'bg-blue-200 text-blue-800',
  'IoT': 'bg-blue-200 text-blue-800',
  'Robotics & Automation': 'bg-emerald-200 text-emerald-800',
  'AI in Robotics': 'bg-emerald-200 text-emerald-800',
  'Nanoelectronics': 'bg-amber-200 text-amber-800',
  'Power Electronics': 'bg-orange-200 text-orange-800',
  
  // Computer Science & IT
  'Web Development': 'bg-yellow-200 text-yellow-800',
  'Mobile App Development': 'bg-orange-200 text-orange-800',
  'App Development': 'bg-orange-200 text-orange-800',
  'Software Development': 'bg-blue-200 text-blue-800',
  'Software Engineering': 'bg-blue-200 text-blue-800',
  'Database Systems': 'bg-green-200 text-green-800',
  'Cloud Computing': 'bg-cyan-200 text-cyan-800',
  'Cloud & DevOps': 'bg-cyan-200 text-cyan-800',
  'DevOps': 'bg-lime-200 text-lime-800',
  'Cybersecurity': 'bg-indigo-200 text-indigo-800',
  'Information Security': 'bg-indigo-200 text-indigo-800',
  
  // AI & ML
  'Artificial Intelligence': 'bg-green-200 text-green-800',
  'AI/ML': 'bg-green-200 text-green-800',
  'Machine Learning': 'bg-green-200 text-green-800',
  'Deep Learning': 'bg-emerald-200 text-emerald-800',
  'Natural Language Processing (NLP)': 'bg-teal-200 text-teal-800',
  'Computer Vision': 'bg-purple-200 text-purple-800',
  'Data Science': 'bg-pink-200 text-pink-800',
  'Big Data Analytics': 'bg-pink-200 text-pink-800',
  
  // Other Technologies
  'Blockchain': 'bg-teal-200 text-teal-800',
  'Algorithms & Data Structures': 'bg-slate-200 text-slate-800',
  'Computer Networks': 'bg-blue-200 text-blue-800',
  'Operating Systems': 'bg-gray-200 text-gray-800',
  
  // Mechanical Engineering
  'Design Engineering': 'bg-blue-200 text-blue-800',
  'CAD/CAM & Robotics': 'bg-green-200 text-green-800',
  'Automotive Engineering': 'bg-red-200 text-red-800',
  'Aerospace Engineering': 'bg-sky-200 text-sky-800',
  
  // Civil Engineering
  'Structural Engineering': 'bg-stone-200 text-stone-800',
  'Environmental Engineering': 'bg-green-200 text-green-800',
  'Transportation Engineering': 'bg-yellow-200 text-yellow-800',
  
  // Electrical Engineering
  'Power Systems': 'bg-yellow-200 text-yellow-800',
  'Renewable Energy Systems': 'bg-green-200 text-green-800',
  'Smart Grid & Energy Management': 'bg-lime-200 text-lime-800'
};

const DomainTag = ({ domain }) => {
  // Try exact match first, then partial match for similar domains
  let colorClasses = domainColors[domain];
  
  if (!colorClasses) {
    // Try to find a partial match for similar domains
    const domainLower = domain.toLowerCase();
    const matchingKey = Object.keys(domainColors).find(key => 
      key.toLowerCase().includes(domainLower) || domainLower.includes(key.toLowerCase())
    );
    colorClasses = matchingKey ? domainColors[matchingKey] : getRandomColor();
  }

  return (
    <span className={`px-3 py-2 bg-opacity-40 rounded-lg text-sm font-medium ${colorClasses}`}>
      {domain}
    </span>
  );
};

// Function to get a random color for unmapped domains
function getRandomColor() {
  const colors = [
    'bg-blue-200 text-blue-800',
    'bg-green-200 text-green-800',
    'bg-purple-200 text-purple-800',
    'bg-pink-200 text-pink-800',
    'bg-indigo-200 text-indigo-800',
    'bg-teal-200 text-teal-800',
    'bg-orange-200 text-orange-800',
    'bg-cyan-200 text-cyan-800',
    'bg-lime-200 text-lime-800',
    'bg-amber-200 text-amber-800'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default DomainTag;