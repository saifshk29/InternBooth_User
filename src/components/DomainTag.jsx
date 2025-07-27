import React from 'react';

const domainColors = {
  'VLSI': 'bg-purple-200 text-purple-800',
  'Embedded C': 'bg-red-200 text-red-800',
  'Embedded': 'bg-red-200 text-red-800',
  'IoT': 'bg-blue-200 text-blue-800',
  'AI/ML': 'bg-green-200 text-green-800',
  'Web Development': 'bg-yellow-200 text-yellow-800',
  'App Development': 'bg-orange-200 text-orange-800',
  'Cloud Computing': 'bg-cyan-200 text-cyan-800',
  'Cybersecurity': 'bg-indigo-200 text-indigo-800',
  'Data Science': 'bg-pink-200 text-pink-800',
  'Blockchain': 'bg-teal-200 text-teal-800',
  'DevOps': 'bg-lime-200 text-lime-800',
  // Add more domains and their colors as needed
};

const DomainTag = ({ domain }) => {
  const colorClasses = domainColors[domain] || 'bg-gray-200 text-gray-800'; // Default color if domain not found

  return (
    <span className={`px-3 py-2 bg-opacity-40 rounded-lg text-sm font-medium ${colorClasses}`}>
      {domain}
    </span>
  );
};

export default DomainTag; 