import { PHOTOS } from './config.js'

export const NAV = [
  { id: 'businesses', en: 'Our businesses', hi: 'हमारे व्यवसाय' },
  { id: 'journey', en: 'Farm to plate', hi: 'फ़ार्म से थाली' },
  { id: 'rates', en: "Today's rates", hi: 'आज के रेट' },
  { id: 'quality', en: 'Quality', hi: 'गुणवत्ता' },
  { id: 'order', en: 'Order', hi: 'ऑर्डर' },
]

// Yearly figures are placeholders for the demo; confirm the real ones with Raja Foods.
export const STATS = [
  { value: 1400, suffix: '+', label: { en: 'birds dispatched daily', hi: 'पक्षी रोज़ भेजे जाते हैं' } },
  { value: 6, suffix: '', label: { en: 'districts supplied', hi: 'ज़िलों में सप्लाई' } },
  { value: 40, suffix: '+', label: { en: 'shops & hotels served', hi: 'दुकानें और होटल' } },
  { value: 2012, suffix: '', label: { en: 'serving since', hi: 'से सेवा में' }, plain: true },
]

export const BUSINESSES = [
  {
    id: 'farm',
    color: '#5b8c2a',
    brand: 'Raja Foods Farm',
    title: { en: 'Our own broiler farm', hi: 'हमारा अपना ब्रॉयलर फ़ार्म' },
    tag: { en: 'Where it all starts', hi: 'जहाँ से सब शुरू होता है' },
    body: {
      en: 'Healthy broilers raised in clean, ventilated sheds with measured feed, vaccination on schedule and a daily health log. Because we grow our own birds, every buyer down the line gets the same steady quality.',
      hi: 'साफ़, हवादार शेड में पले स्वस्थ ब्रॉयलर, नपा-तुला दाना, समय पर टीकाकरण और रोज़ का स्वास्थ्य रिकॉर्ड। अपने पक्षी खुद पालते हैं, इसलिए हर खरीदार तक एक जैसी क्वालिटी पहुँचती है।',
    },
    points: [
      { en: 'Batch-wise records from chick to dispatch', hi: 'चूज़े से डिस्पैच तक हर बैच का रिकॉर्ड' },
      { en: 'Quality feed, clean water, fixed vaccination', hi: 'अच्छा दाना, साफ़ पानी, तय टीकाकरण' },
      { en: 'Sale-ready birds every single day', hi: 'हर दिन बिक्री के लिए तैयार पक्षी' },
    ],
    photo: PHOTOS.flock,
    inset: PHOTOS.chicks,
    cta: { en: 'Visit the farm', hi: 'फ़ार्म देखने आएँ' },
    msg: 'Namaste Raja Foods, I would like to know more about your farm.',
  },
  {
    id: 'district',
    color: '#2a78d6',
    brand: 'Raja Foods',
    title: { en: 'District wholesale', hi: 'ज़िला थोक सप्लाई' },
    tag: { en: 'Bulk live birds, truckloads', hi: 'थोक ज़िंदा पक्षी, ट्रक भर' },
    body: {
      en: 'Large orders of live broilers for traders and agencies across districts. Weighed at loading, invoiced by count and kg, with vehicle and driver details shared before the truck leaves.',
      hi: 'ज़िलों के व्यापारियों और एजेंसियों के लिए ज़िंदा ब्रॉयलर के बड़े ऑर्डर। लोडिंग पर तौल, गिनती और किलो के हिसाब से बिल, ट्रक निकलने से पहले गाड़ी और ड्राइवर की जानकारी।',
    },
    points: [
      { en: 'Truckloads of 250 to 1,000+ birds', hi: '250 से 1,000+ पक्षियों के ट्रक' },
      { en: 'Agreed rates and credit for regular buyers', hi: 'नियमित खरीदारों को तय रेट और उधार' },
      { en: 'Clear bills and statements on WhatsApp', hi: 'WhatsApp पर साफ़ बिल और हिसाब' },
    ],
    photo: PHOTOS.truck,
    inset: PHOTOS.flockClose,
    cta: { en: 'Ask for a bulk rate', hi: 'थोक रेट पूछें' },
    msg: 'Namaste Raja Foods, I need a bulk live broiler rate for my district.',
  },
  {
    id: 'local',
    color: '#eb6834',
    brand: 'Raja Wholesale',
    title: { en: 'Local live-bird distribution', hi: 'स्थानीय ज़िंदा पक्षी सप्लाई' },
    tag: { en: 'Daily routes to chicken shops', hi: 'चिकन दुकानों तक रोज़ का रूट' },
    body: {
      en: 'Our own vehicles run fixed morning routes through town and nearby villages, dropping fresh birds at every chicken shop on the way. Pay in cash or UPI on delivery, or settle weekly.',
      hi: 'हमारी गाड़ियाँ रोज़ सुबह शहर और आसपास के गाँवों में तय रूट पर चलती हैं और हर चिकन दुकान पर ताज़े पक्षी पहुँचाती हैं। डिलीवरी पर कैश या UPI, या साप्ताहिक हिसाब।',
    },
    points: [
      { en: 'Fixed morning routes, on time', hi: 'तय सुबह के रूट, समय पर' },
      { en: 'Weighed at your shop, billed on the spot', hi: 'आपकी दुकान पर तौल, वहीं बिल' },
      { en: 'Small and daily orders welcome', hi: 'छोटे और रोज़ के ऑर्डर भी' },
    ],
    photo: PHOTOS.pickup,
    inset: PHOTOS.flockClose,
    cta: { en: 'Join a delivery route', hi: 'रूट में जुड़ें' },
    msg: 'Namaste Raja Wholesale, please add my chicken shop to your daily route.',
  },
  {
    id: 'retail',
    color: '#c0392b',
    brand: 'Raja Broilers',
    title: { en: 'Retail shop & hotel supply', hi: 'रिटेल दुकान और होटल सप्लाई' },
    tag: { en: 'Fresh cut chicken, cleaned your way', hi: 'ताज़ा कटा चिकन, आपकी पसंद से' },
    body: {
      en: 'Hygienically processed chicken at the Raja Broilers counter: curry cut, whole, boneless, leg pieces and more. Hotels and restaurants get a fixed delivery slot, agreed rates and a monthly statement.',
      hi: 'राजा ब्रॉयलर्स काउंटर पर साफ़-सुथरा प्रोसेस किया चिकन: करी कट, साबुत, बोनलेस, लेग पीस और भी। होटल और रेस्टोरेंट को तय डिलीवरी समय, तय रेट और महीने का स्टेटमेंट।',
    },
    points: [
      { en: 'Cut and cleaned in front of you', hi: 'आपके सामने कटाई और सफ़ाई' },
      { en: 'Daily hotel deliveries before kitchen opens', hi: 'किचन खुलने से पहले होटल डिलीवरी' },
      { en: 'Separate account and statement for every hotel', hi: 'हर होटल का अलग खाता और स्टेटमेंट' },
    ],
    photo: PHOTOS.wholeChicken,
    inset: PHOTOS.curry,
    cta: { en: 'Order for home or hotel', hi: 'घर या होटल के लिए ऑर्डर' },
    msg: 'Namaste Raja Broilers, I would like to order fresh chicken.',
  },
]

export const JOURNEY = [
  { icon: 'egg', title: { en: 'Day-old chicks placed', hi: 'एक दिन के चूज़े' }, text: { en: 'From trusted hatcheries, into clean, warm brooding sheds.', hi: 'भरोसेमंद हैचरी से, साफ़ और गर्म शेड में।' } },
  { icon: 'wheat', title: { en: '~35 days of care', hi: 'लगभग 35 दिन देखभाल' }, text: { en: 'Measured feed, clean water, vaccination and a daily health log.', hi: 'नपा दाना, साफ़ पानी, टीके और रोज़ का स्वास्थ्य रिकॉर्ड।' } },
  { icon: 'scale', title: { en: 'Weighed & checked', hi: 'तौल और जाँच' }, text: { en: 'Only healthy, sale-weight birds (about 2.2 kg) leave the farm.', hi: 'सिर्फ़ स्वस्थ, बिक्री वज़न (लगभग 2.2 किलो) के पक्षी ही बाहर जाते हैं।' } },
  { icon: 'truck', title: { en: 'Dispatched same morning', hi: 'उसी सुबह रवाना' }, text: { en: 'Trucks to districts, route vehicles to shops, birds to our own processing.', hi: 'ज़िलों को ट्रक, दुकानों को रूट गाड़ी, और हमारी प्रोसेसिंग यूनिट को।' } },
  { icon: 'utensils', title: { en: 'Fresh on your plate', hi: 'ताज़ा आपकी थाली में' }, text: { en: 'Cut fresh at Raja Broilers for families, hotels and restaurants.', hi: 'परिवारों, होटलों और रेस्टोरेंट के लिए राजा ब्रॉयलर्स में ताज़ा कटाई।' } },
]

export const AUDIENCES = [
  {
    id: 'traders',
    label: { en: 'Traders & agencies', hi: 'व्यापारी और एजेंसी' },
    unit: 'district',
    photo: PHOTOS.truckFront,
    head: { en: 'Steady supply, truck after truck', hi: 'लगातार सप्लाई, हर ट्रक' },
    points: [
      { en: 'Live birds by count and weight, invoiced the same day', hi: 'गिनती और वज़न से ज़िंदा पक्षी, उसी दिन बिल' },
      { en: 'Credit terms and limits for regular buyers', hi: 'नियमित खरीदारों को उधार की सुविधा' },
      { en: 'Transport arranged to your mandi', hi: 'आपकी मंडी तक ट्रांसपोर्ट' },
    ],
  },
  {
    id: 'shops',
    label: { en: 'Chicken shops', hi: 'चिकन दुकानें' },
    unit: 'local',
    photo: PHOTOS.tempo,
    head: { en: 'Fresh birds at your shutter every morning', hi: 'हर सुबह आपकी दुकान पर ताज़े पक्षी' },
    points: [
      { en: 'Fixed route timing so you can open on time', hi: 'तय रूट समय, ताकि दुकान समय पर खुले' },
      { en: 'Weighed in front of you, bill on WhatsApp', hi: 'आपके सामने तौल, WhatsApp पर बिल' },
      { en: 'Cash, UPI or weekly settlement', hi: 'कैश, UPI या साप्ताहिक हिसाब' },
    ],
  },
  {
    id: 'hotels',
    label: { en: 'Hotels & restaurants', hi: 'होटल और रेस्टोरेंट' },
    unit: 'retail',
    photo: PHOTOS.butterChicken,
    head: { en: 'Kitchen-ready chicken, before service', hi: 'सर्विस से पहले किचन-रेडी चिकन' },
    points: [
      { en: 'Curry cut, boneless and special cuts to your spec', hi: 'करी कट, बोनलेस और आपकी पसंद के कट' },
      { en: 'Agreed monthly rate and fixed delivery slot', hi: 'तय मासिक रेट और तय डिलीवरी समय' },
      { en: 'Your own account and month-end statement', hi: 'आपका अलग खाता और महीने का स्टेटमेंट' },
    ],
  },
  {
    id: 'families',
    label: { en: 'Families', hi: 'परिवार' },
    unit: 'retail',
    photo: PHOTOS.curryNaan,
    head: { en: 'Clean, fresh chicken for home', hi: 'घर के लिए साफ़, ताज़ा चिकन' },
    points: [
      { en: 'Cut and cleaned in front of you', hi: 'आपके सामने कटाई और सफ़ाई' },
      { en: 'Fair weight, fair price, printed bill', hi: 'सही वज़न, सही दाम, छपा बिल' },
      { en: 'Order on WhatsApp, pick up ready', hi: 'WhatsApp पर ऑर्डर, तैयार उठाएँ' },
    ],
  },
]

export const QUALITY = [
  { icon: 'shield', title: { en: 'Vaccinated flocks', hi: 'टीकाकृत झुंड' }, text: { en: 'Every batch follows a fixed vaccination and medicine schedule, logged by date.', hi: 'हर बैच का तय टीका और दवा शेड्यूल, तारीख़ के साथ रिकॉर्ड।' } },
  { icon: 'droplets', title: { en: 'Clean processing', hi: 'साफ़ प्रोसेसिंग' }, text: { en: 'Washed tools, chilled storage with ice, waste removed daily.', hi: 'धुले औज़ार, बर्फ़ में ठंडा भंडारण, रोज़ कचरा निपटान।' } },
  { icon: 'scale', title: { en: 'Honest weight', hi: 'सही वज़न' }, text: { en: 'Digital scales at the farm, on every vehicle and at the shop counter.', hi: 'फ़ार्म, हर गाड़ी और काउंटर पर डिजिटल तराज़ू।' } },
  { icon: 'receipt', title: { en: 'Clear billing', hi: 'साफ़ बिलिंग' }, text: { en: 'Numbered bills, statements on WhatsApp and no surprises in the account.', hi: 'नंबर वाले बिल, WhatsApp पर स्टेटमेंट, खाते में कोई गड़बड़ नहीं।' } },
]

export const FAQ = [
  { q: { en: 'What is the minimum order for live birds?', hi: 'ज़िंदा पक्षियों का न्यूनतम ऑर्डर कितना है?' }, a: { en: 'Chicken shops on our local routes can order from about 25 birds a day. District wholesale orders usually start at 250 birds per vehicle.', hi: 'लोकल रूट की दुकानें लगभग 25 पक्षी रोज़ से ऑर्डर कर सकती हैं। ज़िला थोक ऑर्डर आमतौर पर 250 पक्षी प्रति गाड़ी से शुरू होते हैं।' } },
  { q: { en: 'How is the rate decided?', hi: 'रेट कैसे तय होता है?' }, a: { en: 'The live rate is set every morning per kg of live weight. Regular hotels and buyers can lock an agreed monthly rate.', hi: 'ज़िंदा रेट हर सुबह प्रति किलो ज़िंदा वज़न पर तय होता है। नियमित होटल और खरीदार मासिक रेट तय कर सकते हैं।' } },
  { q: { en: 'Do you give credit?', hi: 'क्या आप उधार देते हैं?' }, a: { en: 'Yes, regular buyers and hotels get credit days and a limit. You receive every bill and a statement on WhatsApp, so the account is always clear.', hi: 'हाँ, नियमित खरीदारों और होटलों को उधार के दिन और सीमा मिलती है। हर बिल और स्टेटमेंट WhatsApp पर मिलता है, तो हिसाब हमेशा साफ़ रहता है।' } },
  { q: { en: 'Can hotels get special cuts?', hi: 'क्या होटलों को खास कट मिल सकते हैं?' }, a: { en: 'Yes. Tell us your menu: curry cut size, boneless, tandoori legs, wings or liver. We prepare it the same way every day.', hi: 'हाँ। अपना मेन्यू बताइए: करी कट साइज़, बोनलेस, तंदूरी लेग, विंग्स या लीवर। हम हर दिन एक जैसा तैयार करते हैं।' } },
  { q: { en: 'Which areas do you deliver to?', hi: 'आप किन इलाकों में डिलीवरी करते हैं?' }, a: { en: 'Daily routes cover our town and nearby villages. Wholesale trucks go to all the districts listed on this page, and we add new routes on demand.', hi: 'रोज़ के रूट शहर और आसपास के गाँव कवर करते हैं। थोक ट्रक इस पेज पर दिए सभी ज़िलों में जाते हैं, और मांग पर नए रूट जोड़ते हैं।' } },
]
