import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, GraduationCap, Building2, Award, Target, Heart, Zap } from 'lucide-react';
import LogoPrimary from '/src/assets/LogoPrimary.png';

function About() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stats = [
    { label: 'Active Students', value: '5000+' },
    { label: 'Partner Companies', value: '100+' },
    { label: 'Successful Placements', value: '2000+' },
    { label: 'Faculty Members', value: '200+' },
  ];

  const features = [
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: 'Student-Centric',
      description: 'Tailored opportunities and guidance for every student\'s career journey.'
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: 'Industry Connections',
      description: 'Direct partnerships with leading companies across various sectors.'
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Quality Assurance',
      description: 'Rigorous vetting process for all internship opportunities.'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Focused Growth',
      description: 'Structured programs designed for skill development and career advancement.'
    }
  ];

  const values = [
    {
      icon: <Heart className="h-6 w-6 text-red-500" />,
      title: 'Passion',
      description: 'We\'re passionate about connecting students with meaningful opportunities.'
    },
    {
      icon: <Users className="h-6 w-6 text-blue-500" />,
      title: 'Community',
      description: 'Building strong relationships between students, faculty, and industry.'
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: 'Innovation',
      description: 'Continuously improving our platform and processes.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img src={LogoPrimary} alt="InternBooth Logo" className="h-16 w-16" />
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              {...fadeIn}
            >
              Bridging Students to Their Future
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              {...fadeIn}
              transition={{ delay: 0.2 }}
            >
              InternBooth is revolutionizing how students connect with internship opportunities,
              making the journey from classroom to career seamless and rewarding.
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            {...fadeIn}
          >
            What Sets Us Apart
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white rounded-lg p-6 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            {...fadeIn}
          >
            Our Core Values
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            {...fadeIn}
          >
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg leading-relaxed">
              To empower students with meaningful internship opportunities that bridge
              the gap between academic learning and professional success, while helping
              companies discover and nurture exceptional talent.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            {...fadeIn}
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of students who have already found their perfect internship match.
            </p>
            <button className="btn-primary btn-lg">
              Start Your Journey
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default About;
