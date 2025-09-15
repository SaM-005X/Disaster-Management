import { UserRole, HazardType, type LearningModule, type Quiz, type Institution, type Badge } from './types';

export const INSTITUTIONS: Institution[] = [
  {
    id: 'inst-1',
    name: 'Delhi Public School, R.K. Puram',
    address: 'Sector XII, R.K. Puram, New Delhi - 110022, India',
    phoneNumber: '+91-11-49115500',
  }
];

export const BADGES: Badge[] = [
  {
    id: 'rookie-responder',
    name: 'Rookie Responder',
    description: 'Complete your first quiz and lab simulation.',
    icon: 'ShieldCheckIcon',
    criteria: (progress) => Object.keys(progress.quizScores).length >= 1 && Object.keys(progress.labScores).length >= 1,
  },
  {
    id: 'quiz-whiz',
    name: 'Quiz Whiz',
    description: 'Achieve a perfect score on any quiz.',
    icon: 'ClipboardCheckIcon',
    criteria: (progress) => Object.values(progress.quizScores).some(q => q.score === q.totalQuestions),
  },
  {
    id: 'lab-pro',
    name: 'Lab Pro',
    description: 'Achieve a score of 90% or higher on any simulation.',
    icon: 'BeakerIcon',
    criteria: (progress) => Object.values(progress.labScores).some(l => l.score >= 90),
  },
  {
    id: 'earthquake-expert',
    name: 'Earthquake Expert',
    description: 'Master the Earthquake module by passing both the quiz and the lab.',
    icon: 'ShieldCheckIcon',
    criteria: (progress, modules) => {
      const earthquakeModule = modules.find(m => m.hazardType === HazardType.EARTHQUAKE);
      if (!earthquakeModule) return false;
      const quizDone = progress.quizScores[earthquakeModule.quizId || ''] !== undefined;
      const labDone = progress.labScores[earthquakeModule.id] !== undefined && progress.labScores[earthquakeModule.id].score >= 75;
      return quizDone && labDone;
    },
  },
  {
    id: 'preparedness-champion',
    name: 'Preparedness Champion',
    description: 'Earn over 1000 points.',
    icon: 'AwardIcon',
    criteria: (progress) => progress.points >= 1000,
  },
];

export const MODULES: LearningModule[] = [
  {
    id: 'mod-1',
    title: 'Earthquake Safety Protocols',
    description: 'Learn how to stay safe before, during, and after an earthquake. Covers Drop, Cover, and Hold On, and the science behind quakes.',
    hazardType: HazardType.EARTHQUAKE,
    regionTags: ['Himalayan Region', 'Seismic Zone V'],
    thumbnailUrl: 'https://wallpaperaccess.com/full/2142495.jpg',
    quizId: 'quiz-1',
    hasLab: true,
    content: [
      { type: 'heading', content: 'Understanding Earthquakes' },
      { type: 'paragraph', content: 'An earthquake is the shaking of the surface of the Earth resulting from a sudden release of energy in the Earth\'s lithosphere that creates seismic waves. Earthquakes can range in size from those that are so weak that they cannot be felt to those violent enough to toss people around and destroy whole cities.' },
      { type: 'video', content: 'https://www.youtube.com/embed/uA_OLKfQpYA' },
      { type: 'heading', content: 'The Science of Shaking: P-Waves & S-Waves' },
      { type: 'paragraph', content: 'Earthquakes release energy in the form of seismic waves. The first waves to arrive are Primary (P-waves), which are fast-moving compression waves. They are followed by Secondary (S-waves), which are slower and move the ground up and down or side-to-side, causing most of the shaking and damage.' },
      { type: 'image', content: 'https://image1.slideserve.com/3132244/p-waves-vs-s-waves-l.jpg' },
      { type: 'heading', content: 'Before an Earthquake' },
      { type: 'list', content: ['Identify safe spots in each room (under a sturdy table, against an interior wall).', 'Secure heavy furniture to walls.', 'Prepare an emergency kit with water, non-perishable food, a first-aid kit, and a flashlight.'] },
      { type: 'heading', content: 'During an Earthquake: Drop, Cover, and Hold On!' },
      { type: 'paragraph', content: 'If you are indoors, stay there. Drop to the ground; take cover by getting under a sturdy table or other piece of furniture; and hold on until the shaking stops. If there isn’t a table or desk near you, cover your face and head with your arms and crouch in an inside corner of the building.' },
      { type: 'image', content: 'https://thumbs.dreamstime.com/z/earthquake-safety-rules-instruction-case-emergency-outline-diagram-earthquake-safety-rules-instruction-case-246612835.jpg' },
      { type: 'heading', content: 'Safety Tip: If You Are Outdoors' },
      { type: 'list', content: ['Move to an open area away from buildings, streetlights, and utility wires.', 'If you are in a crowded public place, take cover where you won\'t be trampled.', 'Stay there until the shaking stops. The greatest danger exists directly outside buildings, at exits, and alongside exterior walls.'] },
      { type: 'heading', content: 'After an Earthquake' },
      { type: 'list', content: ['Check yourself for injuries.', 'Be prepared for aftershocks.', 'If you are in a damaged building, go outside and quickly move away from the building. Do not enter damaged buildings.'] },
      { type: 'heading', content: 'Did You Know?' },
      { type: 'paragraph', content: 'The 1960 Valdivia earthquake in Chile was the most powerful earthquake ever recorded, with a magnitude of 9.5. It triggered a massive tsunami that caused damage as far away as Japan and Hawaii.' }
    ],
    references: [
      { title: 'Ready.gov - Earthquakes', url: 'https://www.ready.gov/earthquakes' },
      { title: 'FEMA: How to Prepare for an Earthquake', url: 'https://www.fema.gov/emergency-managers/risk-management/earthquake' },
      { title: 'USGS Earthquake Hazards Program', url: 'https://www.usgs.gov/programs/earthquake-hazards' }
    ]
  },
  {
    id: 'mod-2',
    title: 'Flood Preparedness and Response',
    description: 'Essential guide to preparing for floods, understanding flood types, and responding safely.',
    hazardType: HazardType.FLOOD,
    regionTags: ['Coastal Areas', 'River Basins'],
    thumbnailUrl: 'https://www.washingtonpost.com/resizer/g6qrtMHTZ6exloEIC7vT0fvEry8=/arc-anglerfish-washpost-prod-washpost/public/BX2IH7HQOYI6ZLAWR67XDFGNPA.jpg',
    quizId: 'quiz-2',
    hasLab: true,
    content: [
        { type: 'heading', content: 'Understanding Floods' },
        { type: 'paragraph', content: 'Floods are the most frequent type of natural disaster and occur when an overflow of water submerges land that is usually dry. Floods are often caused by heavy rainfall, rapid snowmelt, or a storm surge from a tropical cyclone or tsunami in coastal areas.' },
        { type: 'heading', content: 'Types of Floods' },
        { type: 'list', content: ['Flash Floods: Caused by heavy rain in a short period. They are rapid, violent, and can occur with little to no warning.', 'River Floods: Occur when river levels rise and overflow their banks. This is often a slower process, providing more time for warning.', 'Coastal Floods: Result from storm surges associated with tropical cyclones and tsunamis, where seawater is pushed inland.'] },
        { type: 'heading', content: 'How to Prepare for a Flood' },
        { type: 'list', content: ['Know your flood risk. Check if you live in a floodplain.', 'Create a household flood plan and a family communication plan.', 'Build a "Go-Bag" and a "Stay-at-Home Kit".', 'Elevate and anchor critical utilities, such as electrical panels, switches, sockets, water heaters, and furnaces.'] },
        { type: 'video', content: 'https://www.youtube.com/embed/Ixc0TBDhpAg' },
        { type: 'heading', content: 'What to Do During a Flood' },
        { type: 'list', content: ['Evacuate immediately, if told to do so.', 'Never drive around barricades. Local responders use them to safely direct traffic out of flooded areas.', 'Do not walk, swim, or drive through flood waters. Turn Around, Don’t Drown! Just six inches of moving water can knock you down.'] },
        { type: 'heading', content: 'After the Flood: Returning Home Safely' },
        { type: 'list', content: ['Wait for authorities to declare it is safe before returning home.', 'Be aware of hazards like snakes, insects, or other animals that may be in your home.', 'Check for structural damage before entering. If you have any doubts, have it inspected by a professional.', 'Avoid contact with floodwater; it can be contaminated with sewage, chemicals, and other hazardous substances.'] }
    ],
    references: [
      { title: 'Ready.gov - Floods', url: 'https://www.ready.gov/floods' },
      { title: 'American Red Cross - Flood Safety', url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/flood.html' },
      { title: 'NOAA National Weather Service - Flood Safety', url: 'https://www.weather.gov/safety/flood' }
    ]
  },
  {
    id: 'mod-3',
    title: 'Fire Safety in Schools',
    description: 'Learn about fire prevention, the fire triangle, evacuation procedures, and how to use a fire extinguisher.',
    hazardType: HazardType.FIRE,
    regionTags: ['Urban', 'All Institutions'],
    thumbnailUrl: 'https://png.pngtree.com/png-vector/20231106/ourlarge/pngtree-house-fire-png-image_10495889.png',
    quizId: 'quiz-3',
    hasLab: true,
    content: [
      { type: 'heading', content: 'Preventing Fires' },
      { type: 'paragraph', content: 'Most fires are preventable. It is important to be aware of potential fire hazards in your school and home. This includes faulty wiring, overloaded electrical outlets, and improper storage of flammable materials.' },
      { type: 'heading', content: 'The Fire Triangle: Fuel, Oxygen, Heat' },
      { type: 'paragraph', content: 'A fire needs three things to start and continue burning: fuel (something that will burn), oxygen (from the air), and a heat source (like a spark or flame). Removing any one of these elements will extinguish the fire. This is the principle behind firefighting.' },
      { type: 'video', content: 'https://www.youtube.com/embed/h7B6ZwOdKHQ' },
      { type: 'heading', content: 'In Case of Fire: Evacuate!' },
      { type: 'list', content: ['Know your school\'s evacuation plan. Know at least two ways out of every room.', 'When the fire alarm sounds, leave the building immediately.', 'Feel doors for heat before opening them. If a door is hot, use your second way out.', 'Stay low to the ground to avoid smoke inhalation.'] },
      { type: 'image', content: 'https://hsseworld.com/wp-content/uploads/2021/01/Fire-Emergency.jpg' },
      { type: 'heading', content: 'Know Your Fire Extinguisher: The PASS Method' },
      { type: 'list', content: ['PULL the pin.', 'AIM the nozzle at the base of the fire.', 'SQUEEZE the lever slowly and evenly.', 'SWEEP the nozzle from side to side.'] },
      { type: 'heading', content: 'Smoke Alarms Save Lives' },
      { type: 'list', content: ['Install smoke alarms inside and outside each sleeping area and on every level of the building.', 'Test smoke alarms at least once a month.', 'Replace batteries once a year, or when the alarm "chirps" to indicate a low battery.', 'Replace the entire smoke alarm unit every 10 years.'] }
    ],
    references: [
      { title: 'National Fire Protection Association (NFPA)', url: 'https://www.nfpa.org/Public-Education' },
      { title: 'U.S. Fire Administration - Fire Safety for Kids', url: 'https://www.usfa.fema.gov/prevention/outreach/kids.html' },
      { title: 'Ready.gov - Home Fires', url: 'https://www.ready.gov/home-fires' }
    ]
  },
  {
    id: 'mod-4',
    title: 'Surviving Cyclones: A Comprehensive Guide',
    description: 'A detailed guide on cyclone formation, warning systems, and safety measures before, during, and after a cyclone.',
    hazardType: HazardType.CYCLONE,
    regionTags: ['Coastal Regions', 'Tropical Areas'],
    thumbnailUrl: 'https://i.dailymail.co.uk/1s/2019/03/19/11/11177026-6825753-image-a-35_1552994830189.jpg',
    quizId: 'quiz-4',
    hasLab: true,
    content: [
      { type: 'heading', content: 'What is a Cyclone?' },
      { type: 'paragraph', content: 'A cyclone is a large-scale air mass that rotates around a strong center of low atmospheric pressure. They are characterized by high winds, heavy rain, and storm surges in coastal areas. Depending on the location, they are also known as hurricanes or typhoons.' },
      { type: 'video', content: 'https://www.youtube.com/embed/TqZ3M7xh8jM' },
      { type: 'heading', content: 'Before a Cyclone' },
      { type: 'list', content: ['Stay informed with weather updates from official sources.', 'Prepare an emergency kit with food, water, medicine, and important documents.', 'Secure your home: board up windows, clear loose objects from outside, and trim trees.', 'Know your evacuation zone and route.'] },
      { type: 'heading', content: 'During a Cyclone' },
      { type: 'list', content: ['Stay indoors in the strongest part of the building, away from windows and doors.', 'Listen to a battery-powered radio for updates.', 'If the "eye" of the storm passes over, do not go outside. The winds will soon return from the opposite direction.', 'Turn off electricity and gas mains if advised by authorities.'] },
      { type: 'heading', content: 'After the Cyclone' },
      { type: 'paragraph', content: 'The danger is not over after the storm passes. Be aware of potential hazards.' },
      { type: 'list', content: ['Do not enter floodwaters, as they can be contaminated or hide dangers.', 'Beware of downed power lines, damaged buildings, and venomous snakes or insects that may have been displaced.', 'Do not use tap water until authorities declare it is safe.', 'Help others if you can, but do not put yourself at risk.'] }
    ],
    references: [
      { title: 'Ready.gov - Hurricanes', url: 'https://www.ready.gov/hurricanes' },
      { title: 'National Hurricane Center', url: 'https://www.nhc.noaa.gov/' }
    ]
  },
  {
    id: 'mod-5',
    title: 'Tsunami Awareness and Safety',
    description: 'Understand the science of tsunamis, recognize natural warning signs, and learn critical evacuation procedures.',
    hazardType: HazardType.TSUNAMI,
    regionTags: ['Coastal Areas', 'Pacific Ring of Fire'],
    thumbnailUrl: 'https://www.washingtonpost.com/resizer/m5_Fw0k-YJLnwzjnajNg_WYz92g=/arc-anglerfish-washpost-prod-washpost/public/27LGMTEA4UI6XPRCGLJTDWDVGA.jpg',
    quizId: 'quiz-5',
    hasLab: true,
    content: [
      { type: 'heading', content: 'What Causes a Tsunami?' },
      { type: 'paragraph', content: 'Tsunamis are giant waves caused by major disturbances under the ocean, most commonly large undersea earthquakes. They can also be triggered by volcanic eruptions, landslides, or meteorite impacts. These waves can travel across entire oceans at speeds up to 800 km/h.' },
      { type: 'heading', content: 'Natural Warning Signs' },
      { type: 'paragraph', content: 'You may not always receive an official warning. It is crucial to recognize nature\'s signals:' },
      { type: 'list', content: ['A strong earthquake that makes it hard to stand.', 'A sudden rise or fall in sea level. The ocean may recede unusually far from the shoreline.', 'A loud, unusual roar coming from the ocean.'] },
      { type: 'video', content: 'https://www.youtube.com/embed/7EDflnGzjTY' },
      { type: 'heading', content: 'How to Respond' },
      { type: 'paragraph', content: 'If you are in a coastal area and recognize any of the natural warning signs, you must act immediately.' },
      { type: 'list', content: ['Do not wait for an official warning. Evacuate immediately.', 'Move as far inland as possible and to the highest ground you can reach.', 'If caught in a tsunami, grab onto something that floats and try to stay above the turbulent water.'] },
      { type: 'heading', content: 'After a Tsunami' },
      { type: 'list', content: ['Do not return to the coast until authorities declare it is safe. A tsunami is a series of waves, and the first wave is often not the largest.', 'Be prepared for aftershocks from the initial earthquake.', 'Stay out of any building with water around it. Floodwater can cause floors to crack or walls to collapse.'] }
    ],
    references: [
      { title: 'International Tsunami Information Center', url: 'http://itic.ioc-unesco.org/' },
      { title: 'Tsunami.gov', url: 'https://www.tsunami.gov/' }
    ]
  },
  {
    id: 'mod-6',
    title: 'Severe Thunderstorm & Lightning Safety',
    description: 'Learn about the dangers of thunderstorms, including lightning, flash floods, and strong winds, and how to stay safe.',
    hazardType: HazardType.THUNDERSTORM,
    regionTags: ['All Regions', 'Subtropical'],
    thumbnailUrl: 'https://tse1.mm.bing.net/th/id/OIP.RD78cSStXm6gkbE-CFBU6gAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    quizId: 'quiz-6',
    hasLab: true,
    content: [
      { type: 'heading', content: 'The Dangers of Thunderstorms' },
      { type: 'paragraph', content: 'All thunderstorms are dangerous. While they are most common in spring and summer, they can occur at any time. The primary dangers are lightning, flash floods, strong winds (downbursts), hail, and tornadoes.' },
      { type: 'heading', content: 'Lightning Safety: "When Thunder Roars, Go Indoors!"' },
      { type: 'paragraph', content: 'This simple slogan is the most important rule. There is no safe place outdoors during a thunderstorm. As soon as you hear thunder, get to a safe, enclosed shelter.' },
      { type: 'list', content: ['A safe shelter is a substantial building (like a house, school, or office) or a hard-topped metal vehicle.', 'Do NOT seek shelter in sheds, under isolated trees, or at picnic pavilions. These are not safe.'] },
      { type: 'video', content: 'https://www.youtube.com/embed/eNxDgd3D_bU' },
      { type: 'heading', content: 'The 30/30 Rule' },
      { type: 'list', content: ['After seeing lightning, count the time until you hear thunder. If it is 30 seconds or less, the storm is close enough to be a threat. Seek shelter immediately.', 'Wait at least 30 minutes after the last clap of thunder before leaving shelter.'] },
      { type: 'heading', content: 'Indoor Safety' },
      { type: 'list', content: ['Stay off corded phones, computers, and other electronic equipment that put you in direct contact with electricity.', 'Avoid plumbing, including sinks, baths, and faucets. Water can conduct electricity.', 'Stay away from windows and doors, and stay off porches.'] }
    ],
    references: [
      { title: 'Ready.gov - Thunderstorms & Lightning', url: 'https://www.ready.gov/thunderstorms-lightning' },
      { title: 'NOAA - Lightning Safety', url: 'https://www.weather.gov/safety/lightning' }
    ]
  },
  {
    id: 'mod-7',
    title: 'Hazardous Material Incidents',
    description: 'Learn how to respond to chemical spills and other hazardous material (HazMat) incidents in your community.',
    hazardType: HazardType.CHEMICAL_SPILL,
    regionTags: ['Industrial Zones', 'Urban Areas', 'Transport Corridors'],
    thumbnailUrl: 'https://tse2.mm.bing.net/th/id/OIP.lgE6XbrjXFmZg-Aes6zHzAAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    quizId: 'quiz-7',
    hasLab: true,
    content: [
      { type: 'heading', content: 'Understanding HazMat Incidents' },
      { type: 'paragraph', content: 'A hazardous material incident is the release of a harmful substance into the environment. These can be explosions, fires, spills, or leaks. They can happen anywhere, including factories, on railways, or on major roads.' },
      { type: 'heading', content: 'Evacuate or Shelter-in-Place?' },
      { type: 'paragraph', content: 'Local authorities will provide instructions. It is critical to follow them immediately. They will tell you to either evacuate the area or to shelter-in-place.' },
      { type: 'list', content: ['Evacuate: Leave the area immediately in the direction instructed by officials, staying upwind from the incident.', 'Shelter-in-Place: This means staying inside your current location to protect yourself from airborne contaminants.'] },
      { type: 'video', content: 'https://www.youtube.com/embed/9P53Ok6oufc' },
      { type: 'heading', content: 'How to Shelter-in-Place' },
      { type: 'list', content: ['Go indoors immediately. Bring pets with you.', 'Close and lock all windows and exterior doors.', 'Turn off all fans, heating, and air conditioning systems.', 'Go to an interior room with the fewest windows.', 'Seal the room with duct tape and plastic sheeting around windows, doors, and vents.', 'Listen to the radio or TV for further instructions.'] },
      { type: 'heading', content: 'If You Are Exposed' },
      { type: 'list', content: ['Remove all contaminated clothing immediately, cutting it off if necessary to avoid contact with your face.', 'Wash your body thoroughly with soap and water.', 'Seek medical attention as soon as it is safe to do so.'] }
    ],
    references: [
      { title: 'Ready.gov - Hazardous Materials Incidents', url: 'https://www.ready.gov/hazardous-materials-incidents' },
      { title: 'American Red Cross - Chemical Emergencies', url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/chemical-emergency.html' }
    ]
  }
];

export const QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    moduleId: 'mod-1',
    title: 'Earthquake Safety Quiz',
    questions: [
      { id: 'q1-1', questionText: 'What is the first thing you should do during an earthquake?', options: ['Run outside', 'Stand in a doorway', 'Drop, Cover, and Hold On', 'Call for help'], correctOptionIndex: 2 },
      { id: 'q1-2', questionText: 'Where is the safest place to be during an earthquake if you are indoors?', options: ['Near a window', 'Under a sturdy table', 'In an elevator', 'On the top floor'], correctOptionIndex: 1 },
      { id: 'q1-3', questionText: 'What should you do after the shaking stops?', options: ['Immediately go back inside', 'Check for injuries and be wary of aftershocks', 'Use candles for light', 'Turn on the gas stove'], correctOptionIndex: 1 },
      { id: 'q1-4', questionText: 'Which type of seismic wave travels fastest and arrives first?', options: ['S-Waves', 'Surface Waves', 'P-Waves', 'Tsunami Waves'], correctOptionIndex: 2 },
      { id: 'q1-5', questionText: 'If you are outdoors during an earthquake, you should:', options: ['Stand close to a building for support', 'Get inside a car immediately', 'Move to an open area away from buildings and utility wires', 'Climb a tree'], correctOptionIndex: 2 },
    ]
  },
  {
    id: 'quiz-2',
    moduleId: 'mod-2',
    title: 'Flood Preparedness Quiz',
    questions: [
      { id: 'q2-1', questionText: 'What does "Turn Around, Don\'t Drown" mean?', options: ['Swim back the way you came', 'Do not enter floodwaters', 'Wait for rescue', 'Find a higher spot'], correctOptionIndex: 1 },
      { id: 'q2-2', questionText: 'Which item is essential for a flood emergency kit?', options: ['Video games', 'Clean drinking water', 'Winter coat', 'A map of the city'], correctOptionIndex: 1 },
      { id: 'q2-3', questionText: 'Which type of flood is often the most dangerous due to its rapid onset with little warning?', options: ['River Flood', 'Coastal Flood', 'Slow-onset Flood', 'Flash Flood'], correctOptionIndex: 3 },
      { id: 'q2-4', questionText: 'What should you do with your home\'s utilities before evacuating for a flood?', options: ['Leave them on to keep appliances running', 'Turn them up to dry things out', 'Turn them off at the main switches or valves if safe to do so', 'Only turn off the water'], correctOptionIndex: 2 },
      { id: 'q2-5', questionText: 'What is a key reason to avoid contact with floodwater after a flood?', options: ['It is too cold', 'It can be contaminated with hazardous substances', 'It might attract sharks', 'It will ruin your shoes'], correctOptionIndex: 1 },
    ]
  },
   {
    id: 'quiz-3',
    moduleId: 'mod-3',
    title: 'Fire Safety Quiz',
    questions: [
      { id: 'q3-1', questionText: 'If your clothes catch fire, what should you do?', options: ['Run to find water', 'Stop, Drop, and Roll', 'Scream for help', 'Try to fan the flames out'], correctOptionIndex: 1 },
      { id: 'q3-2', questionText: 'Before opening a door during a fire, you should:', options: ['Knock loudly', 'Yell to see if anyone is on the other side', 'Feel it with the back of your hand for heat', 'Open it quickly'], correctOptionIndex: 2 },
      { id: 'q3-3', questionText: 'What are the three components of the fire triangle?', options: ['Wood, Paper, and Matches', 'Fuel, Oxygen, and Heat', 'Water, Foam, and CO2', 'Smoke, Flames, and Ash'], correctOptionIndex: 1 },
      { id: 'q3-4', questionText: 'What does the \'P\' in the PASS method for using a fire extinguisher stand for?', options: ['Press', 'Point', 'Push', 'Pull'], correctOptionIndex: 3 },
      { id: 'q3-5', questionText: 'How often should you test your smoke alarms?', options: ['Once a year', 'Every 5 years', 'At least once a month', 'Only when you change the batteries'], correctOptionIndex: 2 },
    ]
  },
  {
    id: 'quiz-4',
    moduleId: 'mod-4',
    title: 'Cyclone Safety Quiz',
    questions: [
      { id: 'q4-1', questionText: 'What is another name for a cyclone in the Atlantic Ocean region?', options: ['Typhoon', 'Willy-willy', 'Hurricane', 'Tornado'], correctOptionIndex: 2 },
      { id: 'q4-2', questionText: 'What should you do to your windows before a cyclone hits?', options: ['Open them to equalize pressure', 'Cover them with blankets', 'Board them up with plywood', 'Clean them thoroughly'], correctOptionIndex: 2 },
      { id: 'q4-3', questionText: 'If the calm "eye" of the cyclone passes over your area, you should:', options: ['Go outside to assess damage', 'Stay inside as winds will return', 'Begin cleaning up debris', 'Drive to a safer location'], correctOptionIndex: 1 },
      { id: 'q4-4', questionText: 'Which of these is NOT a primary hazard associated with cyclones?', options: ['Strong winds', 'Heavy rain and flooding', 'Earthquakes', 'Storm surge'], correctOptionIndex: 2 },
      { id: 'q4-5', questionText: 'After a cyclone, why should you avoid walking through floodwaters?', options: ['The water is too cold', 'It may contain sharp objects and be contaminated', 'It will damage your clothes', 'You might get lost'], correctOptionIndex: 1 },
      { id: 'q4-6', questionText: 'What is the most important item to have in your emergency kit for communication?', options: ['A smartphone', 'A laptop', 'A battery-powered radio', 'A set of walkie-talkies'], correctOptionIndex: 2 },
      { id: 'q4-7', questionText: 'When preparing for a cyclone, you should:', options: ['Ignore all warnings until you see the storm', 'Clear your property of loose items that could become projectiles', 'Stock up on frozen food', 'Plan to use candles for light'], correctOptionIndex: 1 },
    ]
  },
  {
    id: 'quiz-5',
    moduleId: 'mod-5',
    title: 'Tsunami Awareness Quiz',
    questions: [
      { id: 'q5-1', questionText: 'What is the most common cause of a tsunami?', options: ['Heavy rainfall', 'A powerful hurricane', 'A large undersea earthquake', 'High tides'], correctOptionIndex: 2 },
      { id: 'q5-2', questionText: 'Which of these is a key natural warning sign of a tsunami?', options: ['Birds flying in circles', 'A sudden, noticeable receding of the ocean', 'A change in wind direction', 'A red-colored sky'], correctOptionIndex: 1 },
      { id: 'q5-3', questionText: 'If you are at the beach and feel a strong earthquake, what is the first thing you should do?', options: ['Wait for an official siren', 'Try to find your belongings', 'Move to higher ground and inland immediately', 'Watch the ocean to see if a wave is coming'], correctOptionIndex: 2 },
      { id: 'q5-4', questionText: 'A tsunami is best described as:', options: ['A single, massive wave', 'A series of waves, where the first may not be the largest', 'A type of tidal wave', 'A large storm surge'], correctOptionIndex: 1 },
      { id: 'q5-5', questionText: 'If an official tsunami warning is issued, you should:', options: ['Go to the beach to watch', 'Follow evacuation orders immediately', 'Wait to see if the wave is big', 'Call your friends to ask what they are doing'], correctOptionIndex: 1 },
      { id: 'q5-6', questionText: 'Where is the safest place during a tsunami?', options: ['The ground floor of a strong building', 'In a car, trying to out-drive the wave', 'On a boat in a deep-water harbor', 'As high and as far inland as possible'], correctOptionIndex: 3 },
      { id: 'q5-7', questionText: 'After a tsunami wave has passed, when is it safe to return to the coast?', options: ['After one hour', 'When the water looks calm', 'Only when emergency officials say it is safe', 'As soon as the sun comes out'], correctOptionIndex: 2 },
    ]
  },
  {
    id: 'quiz-6',
    moduleId: 'mod-6',
    title: 'Thunderstorm & Lightning Quiz',
    questions: [
      { id: 'q6-1', questionText: 'What is the safest action to take when you hear thunder?', options: ['Finish your outdoor game quickly', 'Go indoors to a substantial building or vehicle', 'Stand under a large tree for cover', 'Wait until you see lightning'], correctOptionIndex: 1 },
      { id: 'q6-2', questionText: 'The "30/30 Rule" for lightning safety advises seeking shelter if the time between lightning and thunder is:', options: ['60 seconds or less', '10 seconds or less', '30 seconds or less', '5 minutes or less'], correctOptionIndex: 2 },
      { id: 'q6-3', questionText: 'Which of the following is considered a safe shelter during a thunderstorm?', options: ['A golf cart', 'A picnic pavilion', 'A hard-topped car', 'A baseball dugout'], correctOptionIndex: 2 },
      { id: 'q6-4', questionText: 'If you are inside during a thunderstorm, which of these should you AVOID?', options: ['Reading a book', 'Talking to family members', 'Taking a shower or bath', 'Eating a meal'], correctOptionIndex: 2 },
      { id: 'q6-5', questionText: 'What is the main danger associated with lightning?', options: ['The bright flash', 'The loud sound of thunder', 'The powerful electrical discharge', 'The heat it generates'], correctOptionIndex: 2 },
      { id: 'q6-6', questionText: 'If caught outdoors with no shelter, what should you do?', options: ['Lie flat on the ground', 'Find the tallest tree to stand under', 'Crouch down in a low-lying area away from trees', 'Raise a metal object above your head'], correctOptionIndex: 2 },
      { id: 'q6-7', questionText: 'After a thunderstorm passes, how long should you wait after the last thunder clap before resuming outdoor activities?', options: ['10 minutes', '30 minutes', '1 hour', 'As soon as the rain stops'], correctOptionIndex: 1 },
    ]
  },
  {
    id: 'quiz-7',
    moduleId: 'mod-7',
    title: 'Hazardous Materials Quiz',
    questions: [
      { id: 'q7-1', questionText: 'If authorities issue a "shelter-in-place" order, what should you do?', options: ['Evacuate the area immediately', 'Go to the roof for fresh air', 'Go inside, seal windows and doors, and turn off ventilation', 'Continue with your normal activities'], correctOptionIndex: 2 },
      { id: 'q7-2', questionText: 'What does "upwind" mean in the context of a chemical spill?', options: ['In the direction the wind is blowing towards', 'Directly over the spill', 'In the direction the wind is blowing from', 'In a low-lying area'], correctOptionIndex: 2 },
      { id: 'q7-3', questionText: 'Which of these is a key step in sealing a room for shelter-in-place?', options: ['Opening a window slightly for ventilation', 'Using duct tape and plastic sheeting on vents and doors', 'Placing wet towels on the floor', 'Turning on a ceiling fan'], correctOptionIndex: 1 },
      { id: 'q7-4', questionText: 'If you believe you have been exposed to a hazardous chemical, what is the first step?', options: ['Drink plenty of water', 'Wait to see if symptoms develop', 'Remove contaminated clothing and wash your skin', 'Run to the nearest hospital'], correctOptionIndex: 2 },
      { id: 'q7-5', questionText: 'Where are hazardous material incidents most likely to occur?', options: ['Only in rural areas', 'Only in dedicated chemical plants', 'In industrial areas, or on roads and railways', 'Only during the day'], correctOptionIndex: 2 },
      { id: 'q7-6', questionText: 'During a shelter-in-place, what should you turn off?', options: ['Your mobile phone', 'The lights in the room', 'Fans, air conditioning, and heating systems', 'The television'], correctOptionIndex: 2 },
      { id: 'q7-7', questionText: 'What is the best source for instructions during a chemical emergency?', options: ['Social media rumors', 'Advice from a neighbor', 'Official alerts from local authorities', 'News from another city'], correctOptionIndex: 2 },
    ]
  }
];