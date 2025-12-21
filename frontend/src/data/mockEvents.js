// Mock event data for Anveshan MVP
// Realistic college events with urgent deadlines

export const mockEvents = [
    {
        id: 1,
        title: "HackNITT 5.0 - 36 Hour Hackathon",
        description: "Join India's premier student hackathon! Build innovative solutions across tracks like AI/ML, Web3, Healthcare, and Sustainability. Prizes worth ₹5 lakhs, mentorship from industry experts, and networking opportunities with top tech companies.",
        date: "December 28-29, 2025",
        location: "NIT Trichy Campus",
        college: "National Institute of Technology, Tiruchirappalli",
        category: "Hackathon",
        eligibility: "Open to all undergraduate and postgraduate students",
        deadline: "December 24, 2025",
        tags: ["Hackathon", "AI/ML", "Web3", "36-hour"],
        organizer_name: "Delta Force, NIT Trichy"
    },
    {
        id: 2,
        title: "React Workshop: Building Modern Web Apps",
        description: "Hands-on workshop covering React fundamentals, hooks, state management with Redux, and deployment. Perfect for beginners and intermediate developers. Build a complete project from scratch.",
        date: "December 23, 2025",
        location: "Seminar Hall, CSE Department",
        college: "IIT Bombay",
        category: "Workshop",
        eligibility: "Basic JavaScript knowledge required",
        deadline: "December 22, 2025",
        tags: ["Workshop", "React", "Web Development", "Frontend"],
        organizer_name: "Web and Coding Club, IIT Bombay"
    },
    {
        id: 3,
        title: "CodeChef SnackDown Qualifier",
        description: "Compete in one of the world's largest coding competitions. Solve algorithmic challenges, compete with peers globally, and stand a chance to win exciting prizes and internship opportunities.",
        date: "December 26, 2025",
        location: "Online",
        college: "IIIT Hyderabad",
        category: "Competition",
        eligibility: "Open to all",
        deadline: "December 25, 2025",
        tags: ["Competitive Programming", "Algorithms", "Online", "CodeChef"],
        organizer_name: "Programming Club, IIIT Hyderabad"
    },
    {
        id: 4,
        title: "AI in Healthcare: Guest Lecture by Dr. Priya Sharma",
        description: "Explore how artificial intelligence is revolutionizing healthcare. Learn about real-world applications in diagnostics, drug discovery, and personalized medicine from a leading researcher at AIIMS.",
        date: "December 24, 2025",
        location: "Auditorium Block A",
        college: "BITS Pilani",
        category: "Tech Talk",
        eligibility: "Open to all students and faculty",
        deadline: "December 23, 2025",
        tags: ["AI", "Healthcare", "Guest Lecture", "Research"],
        organizer_name: "IEEE Student Branch, BITS Pilani"
    },
    {
        id: 5,
        title: "Shaastra 2026 - Product Design Challenge",
        description: "Design innovative products solving real-world problems. Multidisciplinary challenge welcoming ideas from engineering, design, and business students. Top teams get funding and mentorship.",
        date: "January 3-5, 2026",
        location: "IIT Madras Campus",
        college: "Indian Institute of Technology, Madras",
        category: "Competition",
        eligibility: "Teams of 2-4 students from any discipline",
        deadline: "December 27, 2025",
        tags: ["Product Design", "Innovation", "Multidisciplinary", "Shaastra"],
        organizer_name: "Shaastra, IIT Madras"
    },
    {
        id: 6,
        title: "Cybersecurity Bootcamp: Ethical Hacking 101",
        description: "2-day intensive bootcamp on cybersecurity fundamentals. Learn penetration testing, network security, cryptography, and ethical hacking techniques. Industry certification provided.",
        date: "December 30-31, 2025",
        location: "Computer Lab 3, IT Department",
        college: "Delhi Technological University",
        category: "Workshop",
        eligibility: "CS/IT students, basic networking knowledge preferred",
        deadline: "December 26, 2025",
        tags: ["Cybersecurity", "Ethical Hacking", "Bootcamp", "Certification"],
        organizer_name: "CyberCell DTU"
    },
    {
        id: 7,
        title: "E-Summit Startup Pitch Competition",
        description: "Pitch your startup idea to VCs and industry leaders. Win seed funding up to ₹10 lakhs, incubation support, and mentorship. Open to early-stage startups and aspiring entrepreneurs.",
        date: "January 2, 2026",
        location: "Main Auditorium",
        college: "IIT Delhi",
        category: "Competition",
        eligibility: "Students with startup ideas or early-stage ventures",
        deadline: "December 28, 2025",
        tags: ["Startup", "Entrepreneurship", "Pitch", "Funding"],
        organizer_name: "E-Cell, IIT Delhi"
    },
    {
        id: 8,
        title: "Machine Learning Study Jams by Google",
        description: "Collaborative learning sessions on ML fundamentals using TensorFlow. Complete hands-on labs, earn Google Cloud credits, and get certified. Perfect for ML beginners.",
        date: "December 27, 2025",
        location: "Online + Offline Hybrid",
        college: "VIT Vellore",
        category: "Workshop",
        eligibility: "Open to all, Python basics recommended",
        deadline: "December 24, 2025",
        tags: ["Machine Learning", "TensorFlow", "Google", "Certification"],
        organizer_name: "Google Developer Student Club, VIT"
    },
    {
        id: 9,
        title: "Techfest Robotics Challenge",
        description: "Build autonomous robots to complete challenging tasks. Categories include line following, maze solving, and combat robotics. Prizes worth ₹3 lakhs and internship opportunities.",
        date: "January 4-5, 2026",
        location: "Sports Complex Ground",
        college: "IIT Bombay",
        category: "Competition",
        eligibility: "Teams of 3-5 students, any branch",
        deadline: "December 29, 2025",
        tags: ["Robotics", "Hardware", "Automation", "Techfest"],
        organizer_name: "Techfest, IIT Bombay"
    },
    {
        id: 10,
        title: "Open Source Contribution Workshop",
        description: "Learn how to contribute to open source projects. Understand Git workflows, find beginner-friendly issues, and make your first pull request. Connect with the global developer community.",
        date: "December 25, 2025",
        location: "Online (Zoom)",
        college: "IIIT Bangalore",
        category: "Workshop",
        eligibility: "Basic programming knowledge required",
        deadline: "December 23, 2025",
        tags: ["Open Source", "Git", "GitHub", "Community"],
        organizer_name: "FOSS Club, IIIT Bangalore"
    }
];

// Helper function to get event by ID
export const getEventById = (id) => {
    return mockEvents.find(event => event.id === parseInt(id));
};

// Helper function to filter events by category
export const getEventsByCategory = (category) => {
    return mockEvents.filter(event => event.category === category);
};
