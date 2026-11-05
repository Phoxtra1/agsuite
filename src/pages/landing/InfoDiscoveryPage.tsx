import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Search, GraduationCap, Plane, Laptop, BriefcaseBusiness,
  Sprout, ShieldCheck, Globe2, SlidersHorizontal, ExternalLink,
  ChevronRight, BookOpen, CloudSun, Loader2, CheckCircle2, Compass,
  Package, Warehouse, ArrowUpRight, ShoppingCart, BarChart3, Users, Store,
  AlertTriangle, Info, Lightbulb, Bookmark, BookmarkCheck,
  Printer, Download, FolderPlus, FileCheck2, Wallet, Code, Server, Wrench, Database, CreditCard, Landmark,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getSavedTopics,
  saveTopicBookmark,
  removeSavedTopic,
  isTopicSaved,
  sendTopicToWorkspace,
  recordRecentTopic,
  recordRecentSearch,
  clearRecentTopics,
  getRecentTopics,
  type SavedTopicItem,
  type RecentTopicItem,
} from "@/lib/infoDiscovery/savedTopics";
import { AskTopicPanel } from "@/components/infoDiscovery/AskTopicPanel";
import { VisaChecker } from "@/components/infoDiscovery/VisaChecker";
import { SavedTopicsDrawer } from "@/components/infoDiscovery/SavedTopicsDrawer";
import { PopularAndRecent } from "@/components/infoDiscovery/PopularAndRecent";
import { ProjectGoalTracker } from "@/components/infoDiscovery/ProjectGoalTracker";

type Topic = { title: string; description: string; questions: string[] };
type Section = { title: string; description: string; items: Topic[] };
type Source = { name: string; scope: string; type: string; url: string };
type ProductLink = { label: string; href: string; description: string };
type Category = {
  slug: string; title: string; summary: string; purpose: string; icon: React.ElementType;
  sections: Section[]; sources: Source[]; product?: ProductLink;
};

const topic = (title: string, description: string, questions: string[]): Topic => ({ title, description, questions });
const categories: Category[] = [
  {
    slug: "career-development-education", title: "Career Development and Education", icon: GraduationCap,
    summary: "Explore career direction, abilities, practical learning, education pathways and the skills needed to move from learning into work.",
    purpose: "Career decisions should be based on a realistic understanding of the work, the abilities it requires, the learning path, and the life it may lead to—not salary assumptions, social pressure or a job title alone. This area connects career exploration with practical ability, education choices and learning that can be applied.",
    sections: [
      { title: "Career exploration", description: "Understand professions before committing to a direction.", items: [
        topic("Career fields and professions", "Explore what different fields do, the problems they solve and the environments in which people work.", ["What does a person in this profession actually do each day?", "What problems does this field solve?", "What are the working conditions and responsibilities?"]),
        topic("Interests, strengths and abilities", "Connect personal interests and demonstrated abilities with the demands of different fields.", ["Which activities hold my attention?", "What can I already do well, and what must I develop?", "Which abilities are essential rather than merely helpful?"]),
        topic("Career choice and decision-making", "Compare career options using work realities, learning requirements, costs, opportunities and personal fit.", ["Am I choosing from evidence or from pressure?", "What are the entry requirements and realistic alternatives?", "What would the first three years of this path involve?"]),
        topic("Work environments and responsibilities", "Understand the settings, expectations, risks and responsibilities attached to different roles.", ["Is the work office-based, field-based, remote or shift-based?", "What level of responsibility and accountability is involved?", "What are the physical, social or ethical demands?"]),
      ]},
      { title: "Practical learning and skills", description: "Move beyond remembering information to using it.", items: [
        topic("Practical exercises and projects", "Use guided tasks and projects to test understanding and build evidence of ability.", ["What can I build, repair, calculate, investigate or demonstrate?", "What tools and materials are required?", "How will the result be assessed?"]),
        topic("Problem-solving and creativity", "Develop the ability to identify a problem, test options and improve a solution.", ["What is the actual problem?", "What evidence supports the proposed solution?", "How can the result be tested and improved?"]),
        topic("Digital and technical skills", "Understand the digital foundations and technical skills used across modern study and work.", ["Which digital tools are used in this field?", "What level of competence is expected?", "How can I practise safely and demonstrate the skill?"]),
        topic("Professional preparation", "Prepare for workplace expectations, communication, collaboration and the transition into employment.", ["What does professional conduct look like in this role?", "What evidence should a portfolio or CV contain?", "How are applications, interviews and workplace performance assessed?"]),
      ]},
      { title: "Education pathways", description: "Understand how subjects, qualifications and skills connect to further study and work.", items: [
        topic("Subject and course choices", "Compare school subjects and courses against later study and career requirements.", ["Which subjects are required or recommended?", "Which choices keep future options open?", "What happens if I do not meet a particular requirement?"]),
        topic("Qualifications and entry pathways", "Identify the qualifications, prerequisites and recognised routes into a field.", ["Who awards or recognises the qualification?", "What are the entry requirements?", "Can experience or vocational training provide another route?"]),
        topic("Vocational and professional routes", "Explore technical, trade, apprenticeship and professional routes alongside academic pathways.", ["What practical competence must be demonstrated?", "Is workplace experience part of the training?", "Which authority or professional body recognises the route?"]),
        topic("Further study and funding", "Investigate progression options, application requirements and funding information.", ["What are the application deadlines?", "What fees and living costs apply?", "Are scholarships or financial support available from an official source?"]),
      ]},
      { title: "Formula System and applied knowledge", description: "Understand why principles and formulas work and how to apply them to real situations.", items: [
        topic("Formula System", "Break down formulas into the meaning of each component, the principle behind them, their assumptions and practical uses.", ["What does each variable represent?", "Why does the relationship work?", "What changes when an input changes?", "Where does the formula apply—and where does it not?"]),
        topic("Mathematics in real situations", "Connect mathematical ideas to measurement, money, construction, data and everyday decisions.", ["What is being measured or compared?", "Which units and assumptions matter?", "How can the answer be checked?"]),
        topic("Science and applied reasoning", "Use scientific principles to explain observable effects and solve practical problems.", ["What can be observed or measured?", "What is the proposed explanation?", "What test could support or challenge it?"]),
      ]},
      { title: "School and community initiatives", description: "Explore learning activities and career exposure delivered through Amineva Global.", items: [
        topic("Career Development and Exploration", "Understand the school-based initiative that introduces learners to career realities, practical abilities and informed decision-making.", ["What do learners currently know about different professions?", "Which misconceptions or information gaps need attention?", "What practical exposure would help learners make better choices?"]),
        topic("School engagement and learner response", "Review engagement activities, feedback, participation and the learning needs identified in schools.", ["Which schools and learners participated?", "What questions or misconceptions arose?", "What follow-up activity would be useful?"]),
        topic("Amineva Impact", "Explore the existing Amineva Impact initiatives, school engagements and community learning activities.", ["What initiative was delivered and where?", "What was the learner or community response?", "What evidence and follow-up activities are recorded?"]),
      ]},
    ],
    sources: [
      { name: "UNESCO Institute for Statistics", scope: "Internationally comparable education and related indicators", type: "Official statistical source", url: "https://www.uis.unesco.org/" },
      { name: "ILOSTAT", scope: "Labour, employment, unemployment and decent-work statistics", type: "Official international labour statistics", url: "https://ilostat.ilo.org/data/" },
      { name: "ESCO", scope: "Occupation, skills, competence and qualification descriptions for the European labour market", type: "European Commission classification", url: "https://esco.ec.europa.eu/en/classification" },
      { name: "O*NET Online", scope: "Occupation tasks, skills and work context; United States occupational framework", type: "National occupational reference", url: "https://www.onetonline.org/" },
    ],
    product: { label: "Explore Adesua", href: "https://as.amineva.com", description: "Continue to practical learning, career guidance, self-assessment and examination resources." },
  },
  {
    slug: "travel-destination", title: "Travel and Destination", icon: Plane,
    summary: "Research countries and destinations through entry rules, cost of living, local conditions, employment, education, safety, health and practical travel planning.",
    purpose: "A sound travel or relocation decision involves much more than choosing a destination or checking whether a visa is required. Travellers need to understand the rules attached to their passport and purpose, the places they intend to visit, the cost and conditions of staying there, local safety and health considerations, and the practical steps required before departure. This area helps people organise those questions and identify what must be confirmed with an official government authority or properly authorised service provider. Information can change, so the exact route, nationality, destination and travel date matter.",
    sections: [
      { title: "Country and destination profiles", description: "Understand the place you plan to visit, study in, work in or move to—including differences between cities and regions.", items: [
        topic("Country overview and regions", "Review geography, regions, capital cities, population context, climate, economic indicators and differences between major destinations within a country.", ["Which city, region or local area is relevant to the trip?", "Are national averages representative of the intended destination?", "What is the year, definition and original source for each indicator?", "Are there regional differences that could materially affect the plan?"]),
        topic("Living conditions and public services", "Investigate housing, transport, utilities, healthcare, connectivity and access to public services. Availability and quality can vary significantly between cities and neighbourhoods.", ["What services are available in the intended area?", "How reliable and accessible are transport, water, electricity and internet?", "What healthcare and emergency services are nearby?", "Which public services require proof of residence or local registration?"]),
        topic("Cost of living and personal budgets", "Build a realistic budget for the intended city, length of stay and household size. Separate one-off arrival expenses from recurring living costs and allow for currency changes.", ["What are current housing, food, transport and utility costs in the intended area?", "Which costs are recurring, seasonal or payable in advance?", "What currency and exchange-rate date are being used?", "Have deposits, insurance, application fees and emergency funds been included?"]),
        topic("Culture, language and local norms", "Understand languages, everyday customs, communication styles, social expectations and regional differences that may affect daily life, study, work and respectful travel.", ["Which languages are used in public services and everyday settings?", "Are there local customs or expectations visitors should understand?", "How might language affect access to housing, work or healthcare?", "Where can reliable local orientation or language support be found?"]),
        topic("Accommodation and neighbourhood selection", "Compare accommodation options by location, contract terms, transport access, safety, utilities and total cost rather than rent alone.", ["Is the accommodation close to work, study or planned activities?", "What deposit, contract, notice and utility obligations apply?", "Can the landlord or accommodation provider be verified?", "Are the neighbourhood and transport arrangements suitable at the times they will be used?"]),
        topic("Transport, geography and local movement", "Understand distances, local transport options, road conditions and the practical time required to move between accommodation, work, study and essential services.", ["How far apart are the main destinations?", "Which public transport or licensed taxi options serve the area?", "Are travel times affected by congestion, weather or operating hours?", "Are routes accessible and safe for the traveller's needs?"]),
      ]},
      { title: "Entry, immigration and travel documents", description: "Identify the rules that apply to the traveller's exact passport, purpose, route and intended dates—and confirm them with the responsible authority.", items: [
        topic("Visa and entry requirements", "Check visa, visa-free entry, electronic authorisation, transit, passport-validity, health and supporting-document requirements for a defined nationality and travel purpose. A rule that applies to one passport or purpose may not apply to another.", ["What passport will the traveller use and where was it issued?", "Is the purpose tourism, business, study, employment, transit or residence?", "What are the intended arrival date, departure date and route?", "Which official authority published the applicable rule and when was it checked?"]),
        topic("Official application process", "Identify the responsible immigration authority, embassy or consulate, the correct application channel, required documents, fees, appointments and published processing guidance.", ["Which government department is responsible for this application?", "Must the application be submitted directly or through an authorised provider?", "Are the fees, forms and appointment route confirmed on an official domain?", "What evidence must be original, translated, certified or biometrically submitted?"]),
        topic("Embassies and consular support", "Understand which embassy or consulate has jurisdiction and what assistance it can provide to citizens abroad. Consular services have limits and do not replace local emergency services or legal representation.", ["Which embassy or consulate covers the traveller's location?", "What services are provided and which require appointments?", "How can the mission be contacted during an emergency?", "What help is available for lost passports, detention, serious illness or family emergencies?"]),
        topic("Travel advisories and health requirements", "Review current official safety, health and regional risk notices. Check the issuing authority, intended audience, affected location and date because advisories may differ between governments.", ["Who issued the advisory and whose citizens does it address?", "Which regions, dates and risks are covered?", "Are vaccinations, health certificates or other documents required for this route?", "When was the information last reviewed and what could have changed?"]),
        topic("Passport validity and supporting documents", "Check passport validity, blank-page requirements and supporting evidence for boarding, entry, study, work or residence. Keep secure copies of essential documents without assuming that a copy replaces an original.", ["How much passport validity is required beyond the intended stay?", "Are blank pages, photographs or biometric details required?", "Which bookings, invitations, funds or accommodation records must be shown?", "Are translations, notarisation or certified copies required?"]),
        topic("Transit, stopovers and connecting flights", "Check whether a traveller needs transit permission or must meet additional conditions when changing airports, terminals or airlines, collecting baggage or entering a country during a stopover.", ["Does the traveller remain airside or pass immigration?", "Are separate tickets or airport changes involved?", "Does the transit country require a visa for this passport?", "Could an overnight stop or baggage collection change the entry requirements?"]),
        topic("Travel insurance and trip protection", "Understand how travel insurance may cover medical emergencies, evacuation, cancellations, delays, baggage and other disruptions. Compare policy exclusions, limits and eligibility rather than relying on the product name alone.", ["Are pre-existing conditions, planned activities and destination risks covered?", "What are the medical, evacuation and cancellation limits?", "Which exclusions and excesses apply?", "How does the traveller contact the insurer and obtain emergency approval?"]),
      ]},
      { title: "Work, education and longer-term stay", description: "Assess whether a destination supports a longer-term plan and understand the permission, qualification and legal conditions involved.", items: [
        topic("Employment and unemployment", "Review labour-market conditions, occupations in demand, wage information and work-authorisation requirements. A labour-market opportunity does not automatically give a foreign national permission to work.", ["Are the figures national, regional or city-specific?", "Do they cover citizens, residents or foreign workers?", "Does the job require sponsorship, registration or a work permit?", "Are the employer and vacancy independently verifiable?"]),
        topic("Education and study opportunities", "Compare recognised institutions, courses, admission requirements, tuition, living costs, student support and international-student conditions.", ["Is the institution and qualification officially recognised?", "What are the admission, language and academic requirements?", "What tuition, deposits and living expenses are payable?", "What visa, attendance and work conditions apply to international students?"]),
        topic("Discrimination, racism and inclusion", "Examine documented social conditions, legal protections, inclusion policies and reported experiences without treating an entire country or population as uniform.", ["What protections exist in law and which settings do they cover?", "Are reports official statistics, surveys, journalism or personal accounts?", "How recent and geographically relevant is the evidence?", "What complaint, support or reporting channels are available?"]),
        topic("Laws, rights and responsibilities", "Identify laws and local obligations that materially affect visitors, students, workers and residents, including conduct, employment, tenancy, driving and registration requirements.", ["Which laws apply to the intended activity and length of stay?", "Are there rules that differ materially from the traveller's home country?", "Which official legal or government source is authoritative?", "What duties or deadlines apply after arrival?"]),
        topic("Residence permits and long-term stay", "Understand the distinction between short visits, temporary residence, permanent residence and citizenship routes. Eligibility, renewal conditions and rights depend on the country's current laws.", ["Which permit category matches the intended reason for staying?", "What eligibility, income, sponsorship or family conditions apply?", "When must the permit be renewed and what happens if it expires?", "Which activities are allowed or restricted under the permit?"]),
        topic("Recognition of qualifications and professional licensing", "Check whether foreign academic or professional qualifications need evaluation, registration, local examinations or licensing before the holder can study or practise a regulated occupation.", ["Which authority evaluates the qualification?", "Does the profession require registration or a local licence?", "Are translations, transcripts or verified certificates required?", "Can the applicant work while recognition or licensing is pending?"]),
      ]},
      { title: "Safety, health and traveller support", description: "Prepare for personal safety, medical needs, accessibility and unexpected events using advice relevant to the actual destination.", items: [
        topic("Healthcare access and medical preparation", "Understand how visitors or residents access medical care, what services may require payment, and what health preparations are relevant before departure.", ["Is the traveller eligible for public healthcare or must care be paid privately?", "Are routine medicines available and can they be legally brought across the border?", "Are vaccinations or health certificates required for the route?", "What medical records or prescriptions should the traveller carry?"]),
        topic("Emergency services and incident response", "Identify the correct emergency contact routes and practical steps for serious illness, accidents, crime, detention or loss of essential documents.", ["What are the local emergency numbers for police, fire and medical response?", "Where is the nearest suitable hospital or urgent-care service?", "How should the traveller contact their embassy or consulate?", "Who at home should hold a copy of the itinerary and emergency contacts?"]),
        topic("Personal safety and local risk awareness", "Consider destination-specific risks such as theft, scams, unsafe transport, restricted areas, demonstrations and severe weather. Advice should be specific to the location and reviewed close to departure.", ["Which risks are reported for the exact city or region?", "Are there areas, times or activities requiring additional precautions?", "How can accommodation, transport and local service providers be checked?", "What is the plan if the traveller loses access to money, a phone or documents?"]),
        topic("Accessibility and special travel needs", "Plan for mobility, disability, sensory, dietary, religious, pregnancy-related or other individual requirements by confirming facilities and assistance with the relevant provider before travel.", ["Are transport, accommodation and public spaces accessible for the traveller's needs?", "What assistance must be requested in advance?", "Are medical equipment, medicines or support animals subject to special rules?", "Can the provider confirm arrangements in writing?"]),
      ]},
      { title: "Practical destination planning", description: "Turn destination research into a realistic itinerary, budget and departure checklist.", items: [
        topic("Itinerary, distance and seasonal planning", "Plan activities around geography, opening days, local seasons, climate, transport times and realistic travel distances. Avoid assuming nearby places are always quick or easy to reach.", ["Which places are essential and how much time is needed at each?", "Are seasonal conditions or public holidays likely to affect the trip?", "Are transport times and opening hours confirmed?", "Is there contingency time for delays or changes?"]),
        topic("Currency, payments and financial access", "Understand the destination currency, exchange costs, card acceptance, cash needs, banking access and safe ways to carry money.", ["What currency is used and what is the exchange-rate date?", "Will cards, mobile payments or cash be accepted for essential expenses?", "What fees apply to withdrawals, conversions and overseas card use?", "How will the traveller access emergency funds if a payment method fails?"]),
        topic("Phone, internet and digital connectivity", "Check mobile roaming, local SIM or eSIM options, network coverage, identity requirements and access to essential digital services.", ["Will the traveller's current phone and SIM work at the destination?", "Is registration or identification required for a local SIM?", "Can maps, tickets and important documents be accessed offline?", "How will account security be protected when using public networks?"]),
        topic("Booking checks and departure preparation", "Review accommodation and transport confirmations, cancellation conditions, baggage rules, document copies and the sequence of tasks required before departure.", ["Are names and passport details identical across bookings and documents?", "Are baggage, check-in and cancellation rules confirmed with the provider?", "Are transport connections realistic and protected against delays?", "Are essential documents, medicines and emergency contacts ready?"]),
      ]},
    ],
    sources: [
      { name: "IATA Travel Centre", scope: "Passport, visa and health information used in airline travel-document checks", type: "Travel-document reference; confirm with government authority", url: "https://www.iata.org/en/travel-centre/" },
      { name: "UK Foreign Travel Advice", scope: "Destination-specific safety, entry, health and local-law advice for UK travellers", type: "Official UK government advice", url: "https://www.gov.uk/foreign-travel-advice" },
      { name: "U.S. Department of State — Travel", scope: "Destination advisories and entry, safety and consular information for U.S. travellers", type: "Official U.S. government advice", url: "https://travel.state.gov/content/travel/en/international-travel.html" },
      { name: "World Bank Open Data", scope: "Country-level development and economic indicators; not a visa or travel-rules source", type: "Official international statistics", url: "https://data.worldbank.org/" },
    ],
  },
  {
    slug: "it-innovation", title: "IT Services and Support", icon: Laptop,
    summary: "Understand the IT services organisations rely on: websites and software, technical support, networks, cloud infrastructure, cybersecurity, databases and system maintenance.",
    purpose: "Technology is part of everyday operations. Websites, applications, computers, networks, business email, databases and cloud services all need to be planned, configured, maintained and protected. This area helps individuals and organisations understand common IT service needs, what can go wrong when systems are neglected, how to assess providers and how to plan dependable technical support. The aim is practical technology awareness—not assumptions that every organisation needs the same system or service.",
    sections: [
      { title: "IT planning and technical support", description: "Identify technology needs, manage devices and accounts, and obtain the right technical assistance.", items: [
        topic("IT assessment and technology planning", "Review an organisation's current devices, systems, connectivity, workflows, risks and priorities before choosing new technology or services.", ["Which business activity needs technical support or improvement?", "What systems, devices and subscriptions are already in use?", "Which risks or service interruptions need attention first?", "How will the proposed work be scoped, costed and reviewed?"]),
        topic("IT support and technical troubleshooting", "Understand helpdesk support, fault diagnosis, escalation, remote assistance and the documentation needed to resolve recurring technology problems.", ["What happened, when did it start and who is affected?", "Is the issue related to a device, application, account, network or service provider?", "What response time and escalation route are appropriate?", "Has the fix been tested and documented?"]),
        topic("Computer, device and endpoint management", "Manage computers, phones, printers and other connected devices through setup, configuration, updates, inventory, security and retirement.", ["Who owns each device and who is authorised to use it?", "Are operating systems and applications supported and updated?", "Are lost or retired devices securely removed from organisational access?", "Are device records, warranties and licences maintained?"]),
        topic("Business email, domains and online presence", "Understand domain registration, DNS, business email, website hosting, SSL certificates and the settings needed to keep online services reachable and trustworthy.", ["Who controls the domain and its renewal?", "Are DNS, email authentication and website certificates correctly configured?", "Can staff recover access if an administrator leaves?", "Are website and email services monitored for interruption?"]),
      ]},
      { title: "Websites, software and digital systems", description: "Understand how digital services are designed, developed, integrated, tested and maintained.", items: [
        topic("Website and web application development", "Explore how requirements, user experience, frontend and backend development, testing, deployment and ongoing maintenance come together in a working website or application.", ["What should users be able to do with the system?", "Which information and workflows must it handle?", "How will accessibility, security and performance be tested?", "Who will maintain the system after launch?"]),
        topic("Custom software and mobile application development", "Understand when an organisation may need tailored software or a mobile application, and how to evaluate scope, usability, ownership and long-term support.", ["Is an existing product sufficient or is custom development justified?", "Which users, devices and operating systems must be supported?", "Who owns the source code, data and deployment accounts?", "What training, documentation and maintenance are included?"]),
        topic("Software maintenance and application reliability", "Review upgrades, compatibility, defect correction, performance, monitoring and release management so that software remains usable after deployment.", ["How are issues reported, prioritised and resolved?", "Are changes tested before they reach users?", "Are dependencies and unsupported components reviewed?", "Can the previous stable version be restored if an update fails?"]),
        topic("System integration and APIs", "Connect separate applications and services through documented interfaces, controlled permissions and reliable data exchange.", ["Which system is the authoritative source for each record?", "How are credentials, permissions and data transfers protected?", "What happens when a connection fails or sends the same event twice?", "Can integration activity be monitored and reconciled?"]),
      ]},
      { title: "Networks, cloud and infrastructure", description: "Keep the underlying technology environment connected, available, recoverable and appropriately maintained.", items: [
        topic("Computer networks, Wi-Fi and connectivity", "Understand wired and wireless networks, routers, switches, internet connectivity, network coverage and secure access for staff and guests.", ["Where are network weak spots or recurring connection failures?", "Are business and guest devices separated appropriately?", "Who manages network equipment, passwords and firmware updates?", "Is the internet connection suitable for the organisation's critical workflows?"]),
        topic("Servers, hosting and infrastructure management", "Explore server provisioning, operating systems, storage, monitoring, updates, capacity and the responsibilities involved in maintaining hosted systems.", ["Where does each application or service run?", "Who is responsible for patching, monitoring and incident response?", "Are storage, compute and bandwidth sized for actual demand?", "What is the recovery plan if a server or hosting provider becomes unavailable?"]),
        topic("Cloud services and deployment", "Compare managed cloud services with self-hosted environments, including identity, storage, networking, deployment, usage limits and ongoing costs.", ["What does the selected service include and exclude?", "Where are operational data and backups stored?", "Are access controls, usage limits and recurring costs understood?", "How can services be moved or restored if the provider relationship changes?"]),
        topic("Backups, recovery and service continuity", "Plan how important files, databases and applications are backed up, tested and restored after accidental deletion, system failure, cyber incident or outage.", ["Which systems and records are essential to restore first?", "How often are backups created and how long are they retained?", "Are backups protected from unauthorised changes or deletion?", "When was a full restoration test last completed?"]),
      ]},
      { title: "Cybersecurity and data management", description: "Protect accounts, devices, systems and information while maintaining dependable records.", items: [
        topic("Cybersecurity and access management", "Understand identity controls, strong authentication, role-based permissions, secure configuration, patching and incident response across organisational technology.", ["Who has access to each system and why?", "Are administrator accounts limited and protected with stronger authentication?", "How quickly can access be suspended when a device or account is compromised?", "Are security events reviewed and acted upon?"]),
        topic("Data protection and database management", "Explore how organisations structure, validate, store, back up and control access to operational records in databases and other information systems.", ["What information is collected and why is it needed?", "Who may view, change, export or delete the records?", "Are data quality, retention and backup requirements documented?", "Can important records be retrieved and verified when needed?"]),
        topic("Database design, migration and performance", "Understand data models, migrations, query performance, indexing and the checks needed when moving information between systems.", ["Has the current data structure been documented?", "Are duplicates, missing values and inconsistent formats identified before migration?", "How will the migrated data be reconciled against the source?", "Can the database handle expected use without exposing unnecessary information?"]),
        topic("IT service providers, contracts and service levels", "Evaluate technical providers through scope, responsibilities, response times, service levels, access arrangements, deliverables and exit plans.", ["What is included in the service and what is billed separately?", "Who owns accounts, credentials, code, domains and data?", "How are incidents, changes and unresolved issues escalated?", "What documentation and handover are required when an engagement ends?"]),
      ]},
    ],
    sources: [
      { name: "NIST Cybersecurity Framework 2.0", scope: "Cybersecurity risk governance and management outcomes", type: "Official standards guidance", url: "https://www.nist.gov/cyberframework" },
      { name: "OWASP Top 10", scope: "Common critical web application security risk categories", type: "Open security reference", url: "https://owasp.org/projects/top-ten" },
      { name: "CISA", scope: "Cybersecurity, secure-by-design and infrastructure protection guidance", type: "Official U.S. cyber defence agency", url: "https://www.cisa.gov/" },
      { name: "Cloud Security Alliance", scope: "Cloud security practices and guidance", type: "Industry security reference", url: "https://cloudsecurityalliance.org/" },
    ],
    product: { label: "Explore DataLens", href: "https://app.amineva.com", description: "Continue to DataLens for website and application maintenance, software development, cloud infrastructure, database management and professional IT support." },
  },
    slug: "business-management", title: "Business Management", icon: BriefcaseBusiness,
    summary: "Understand how a business controls inventory, purchasing, sales, cash flow, employee responsibilities, financial records and day-to-day performance.",
    purpose: "Running a business requires more than recording sales. Owners and managers need a dependable picture of what the business holds, what it buys and sells, what money is expected and received, what it owes, who is responsible for each activity and where losses or delays occur. This area introduces the practical systems, records, checks and management measures that help a business operate with greater control. It is an educational starting point; accounting, tax, employment and regulatory decisions should be checked against the rules and qualified advice that apply to the business.",
    sections: [
      { title: "Inventory and stock operations", description: "Control products and materials from purchasing and receipt through storage, movement, sale and replenishment.", items: [
        topic("Inventory and stock records", "Maintain a dependable record of each item, quantity, location, movement and person responsible. Understand how receiving, transfers, sales and adjustments affect the recorded balance.", ["Does every stock movement have a dated and traceable record?", "Can stock be identified by item, location, batch or serial number where needed?", "Who confirms goods received, transferred and dispatched?"]),
        topic("Product catalogues and stock classification", "Organise items using consistent names, codes, units, categories and variants so that purchasing, sales and stock reports refer to the same products.", ["Does each item have one consistent identifier?", "Are pack sizes, units and variants clearly distinguished?", "Can staff find and record an item without creating duplicate entries?"]),
        topic("Stocktaking and discrepancies", "Compare recorded quantities with physical counts, investigate differences and document the reason for each approved correction.", ["What quantity did the records show at the count time?", "Were sales, deliveries and transfers paused or accounted for during counting?", "Has each difference been investigated and approved before the balance is changed?"]),
        topic("Stock valuation and cost of goods sold", "Understand how purchase costs and other eligible costs affect inventory value and the cost assigned to goods sold. Apply a consistent method appropriate to the business and its reporting requirements.", ["Which costs are included in the inventory cost?", "Which valuation method is permitted and consistently applied?", "Can the value of closing stock be reconciled to quantity records and purchase evidence?"]),
        topic("Reorder levels and stock replenishment", "Plan purchasing around sales patterns, lead times, available cash, supplier reliability and the risk of holding too much or too little stock.", ["Which items regularly run out or remain unsold?", "How long does each supplier take to deliver?", "Are reorder quantities based on demand, lead time, available storage and cash?"]),
        topic("Loss, damage, expiry and shrinkage", "Identify expired, damaged, missing or otherwise unsaleable goods, record the reason and monitor repeated loss patterns.", ["Are damaged or expired items separated from saleable stock?", "Can losses be traced to a date, location, item and responsible process?", "Which preventive measures would reduce repeated losses?"]),
      ]},
      { title: "Purchasing, sales and transactions", description: "Connect buying, receiving, selling, payments, refunds and supporting documents.", items: [
        topic("Purchasing and supplier records", "Record supplier details, purchase requests, orders, delivery notes, invoices and payment status so that purchases can be checked from request to settlement.", ["Was the purchase authorised before the order was placed?", "Do the order, goods received and supplier invoice agree?", "Are supplier prices, delivery terms and outstanding balances reviewed?"]),
        topic("Sales and transaction records", "Keep complete records of sales across cash, card, mobile money, bank transfer and other channels, including receipts, discounts, fees and adjustments.", ["Can every sale be traced to a transaction or receipt reference?", "Are all sales channels included in the daily totals?", "Are discounts, fees, voids and refunds recorded transparently?"]),
        topic("Cash, bank and mobile-money reconciliation", "Compare expected receipts and payments with cash counts, bank statements, mobile-money reports and payment-provider settlements. Investigate timing differences, charges and reversals rather than forcing totals to agree.", ["What amount should have been received for the period?", "What amount actually reached each cash or payment account?", "Are fees, pending settlements, reversals and cash expenses documented separately?"]),
        topic("Returns, refunds and transaction adjustments", "Use clear reasons, supporting records and approval steps when a sale, payment or stock record is reversed or corrected.", ["Is the original transaction retained for traceability?", "Does the returned item physically re-enter stock where appropriate?", "Who can approve a refund, void or adjustment, and what evidence is required?"]),
        topic("Receipts, invoices and document control", "Understand how purchase invoices, sales invoices, receipts, delivery notes and credit notes support business records and later reconciliation.", ["Does each document identify the parties, date, items and amounts?", "Can a payment be matched to the invoice it settles?", "Are duplicate, missing or altered documents identified and retained appropriately?"]),
      ]},
      { title: "Cash flow and financial visibility", description: "Understand the timing of money entering and leaving the business, and distinguish cash availability from sales and accounting profit.", items: [
        topic("Cash flow management and forecasting", "Track expected cash inflows and outflows over a defined period so that a business can anticipate shortages, plan payments and avoid relying on sales figures alone.", ["What cash is available now, not merely recorded as sales?", "Which payments and receipts are expected and on what dates?", "What happens to the forecast if a customer pays late or a major cost increases?"]),
        topic("Accounts receivable and customer credit", "Monitor money owed by customers, payment terms, overdue invoices, collections and credit exposure.", ["Which invoices remain unpaid and how long have they been outstanding?", "Are credit limits and payment terms approved and recorded?", "Who follows up overdue balances and records agreed payment arrangements?"]),
        topic("Accounts payable and supplier obligations", "Monitor supplier invoices, due dates, agreed terms and payment status to avoid missed obligations and duplicate payments.", ["Which supplier balances are due and when?", "Has each invoice been checked against the purchase and delivery records?", "Are payments authorised and matched to the correct supplier account?"]),
        topic("Revenue, expenses and operating margins", "Understand how sales revenue, direct costs, operating expenses and other charges affect business performance. Distinguish revenue, cash received, gross profit and net profit.", ["Are sales reported before or after discounts, returns and taxes?", "Which costs are directly associated with the goods or services sold?", "Can changes in costs and margins be explained over time?"]),
        topic("Daily cash position and financial records", "Prepare a regular view of cash on hand, balances in business accounts, expected receipts, upcoming payments and unresolved differences.", ["Are personal and business funds recorded separately?", "Do opening balances, movements and closing balances reconcile?", "Are supporting documents available for material transactions?"]),
      ]},
      { title: "Employees, accountability and internal controls", description: "Make responsibilities clear, protect business assets and ensure that important actions can be checked.", items: [
        topic("Employee accountability and responsibilities", "Connect each role with its assigned duties, authorised actions, records and expected outcomes. Accountability should be based on clear responsibilities and evidence, not assumptions.", ["Who owns each task, asset or process?", "What evidence confirms that the work or handover was completed?", "Are staff responsibilities and access rights clearly communicated?"]),
        topic("Shift handovers and cash custody", "Use documented handovers for cash, stock, keys, devices and open tasks when responsibility moves between employees or shifts.", ["What balance or quantity was handed over and received?", "Were exceptions, pending orders or unresolved issues recorded?", "Can the person handing over and the person receiving confirm the record?"]),
        topic("Approvals and separation of duties", "Set approval limits and divide sensitive activities where practical so that one person does not control every stage of a transaction.", ["Who can request, approve, receive and pay for a purchase?", "Which actions require a second review or owner approval?", "Are approval limits appropriate to transaction value and risk?"]),
        topic("Internal controls and loss prevention", "Use reconciliations, access restrictions, inventory counts, documented approvals and exception reviews to reduce error, misuse, fraud and unauthorised changes.", ["Which business assets and records are most exposed to loss or misuse?", "Are critical actions logged and reviewed?", "Are unusual transactions and unexplained differences investigated independently where practical?"]),
        topic("Business records, access and audit trails", "Maintain orderly records of who created, changed, approved or reversed important business transactions, while limiting access to people who need it.", ["Can a record's history and responsible user be established?", "Are shared accounts and unnecessary permissions avoided?", "Are backups, retention and document access arrangements appropriate?"]),
      ]},
      { title: "Operational efficiency and management reporting", description: "Use practical measures and dependable reports to understand performance, identify bottlenecks and decide what needs attention.", items: [
        topic("Operational efficiency and process improvement", "Map recurring business activities, identify delays and repeated errors, and improve the process without removing necessary checks.", ["Where do orders, approvals or deliveries regularly get delayed?", "Which steps are duplicated or dependent on one person?", "How will the business confirm that a process change has improved the result?"]),
        topic("Business performance indicators and KPIs", "Choose a small set of measures that reflect the business model, such as stock turnover, gross margin, overdue invoices, sales trends, operating costs and order fulfilment.", ["Does each indicator have a clear definition and reporting period?", "Can the figure be traced to reliable underlying records?", "Does the measure encourage the right behaviour or create unintended incentives?"]),
        topic("Management reports and business decisions", "Bring sales, inventory, cash, purchasing and operational information together into reports that help owners understand results and take timely action.", ["Which decisions should the report support?", "Are actual results compared with a meaningful target or previous period?", "Are missing data, estimates and unresolved exceptions clearly identified?"]),
      ]},
    ],
    sources: [
      { name: "IFRS for SMEs", scope: "Financial reporting requirements designed for eligible small and medium-sized entities", type: "Official international accounting standard", url: "https://www.ifrs.org/issued-standards/ifrs-for-smes/" },
      { name: "ACFE / COSO Fraud Risk Management", scope: "Fraud governance, risk assessment, control activities, investigation and monitoring", type: "Professional control guidance", url: "https://www.acfe.com/fraud-resources/fraud-risk-tools---coso/fraud-risk-management-guide" },
      { name: "OECD Data Explorer", scope: "Comparable economic and business-related indicators across participating economies", type: "International statistical source", url: "https://data-explorer.oecd.org/" },
    ],
    product: { label: "Explore Inventra", href: "https://stock.amineva.com", description: "Continue to Inventra for inventory, stock operations and related business management workflows." },
  },
  {
  {
    slug: "financial-operations", title: "Financial Operations", icon: Wallet,
    summary: "Understand how financial transactions are monitored, payments are reconciled, income and expenses are recorded, cash flow is managed and financial performance is reported.",
    purpose: "Financial operations depend on accurate transactions, reliable account records and clear responsibility for money moving through an organisation. Mobile money vendors, microfinance institutions, microcredit providers, savings and loans operators, rural banks and other financial service organisations need to understand what has been received, paid, disbursed, collected, settled or left outstanding. Businesses also need dependable records of income, expenses, payments, cash flow and financial obligations. This area explains why those practices matter, how records fit together and what managers should review. It is educational guidance, not a substitute for regulated financial, accounting or legal advice.",
    sections: [
      { title: "Transaction monitoring and financial networks", description: "Understand the movement, status and oversight of transactions across agents, branches and financial service operations.", items: [
        topic("Financial transactions and monitoring", "Understand how to record and monitor deposits, withdrawals, transfers, collections, payments, disbursements, reversals and adjustments with clear references and status history.", ["Can each transaction be traced to a date, amount, channel, account and responsible operator?", "Is the transaction pending, completed, reversed, failed or under review?", "Are duplicate, incomplete or unusual entries identified rather than silently ignored?", "Can the transaction history be reviewed by an authorised person?"]),
        topic("Mobile money agent transactions and float management", "Explore how mobile money vendors monitor cash and electronic float, customer transactions, commissions, settlement activity and daily operating balances.", ["How much physical cash and electronic float is available at the start and end of the day?", "Are cash-in, cash-out, transfers and reversals recorded against the correct service channel?", "Do provider statements and agent records agree after fees and commissions?", "What is the plan when cash or electronic float becomes insufficient?"]),
        topic("Microcredit disbursements and repayment tracking", "Understand how loan disbursements, repayment schedules, collections, arrears, rescheduling and outstanding balances should be recorded and reviewed.", ["Does each disbursement link to an approved facility and borrower record?", "Are expected repayments compared with actual collections?", "How old are overdue amounts and what explains the delay?", "Are rescheduled, written-off or amended balances clearly distinguished from normal repayments?"]),
        topic("Savings, contributions and member accounts", "Explore how savings deposits, member contributions, withdrawals, payouts and account balances are recorded so that individuals and institutions can verify activity over time.", ["Can each contribution or withdrawal be traced to the correct member and account?", "Are member statements consistent with the institution's transaction records?", "Are payout rules, dates and approvals documented?", "How are corrections handled without losing the original transaction history?"]),
        topic("Branch, agent and service-point monitoring", "Understand how managers compare activity across branches, tellers, mobile money agents, field collectors and other service points while maintaining fair, evidence-based oversight.", ["Which transactions and balances should each service point report at close of business?", "Are cash, float, collections and unresolved exceptions reviewed consistently?", "Can activity be traced to the correct staff member and location?", "How are differences escalated and followed up?"]),
        topic("Collector field operations and daily summaries", "Understand how field collectors record member deposits and collection activity through a mobile workflow, and how daily summaries help supervisors review amounts, customers, pending records and field activity.", ["Does each field entry identify the collector, customer or member, amount, date and reference?", "Can a collector review the deposits recorded for the day?", "How are new field records synchronised with the organisation's main dashboard?", "What should happen when a collector's device is offline or a record needs correction?"]),
        topic("Debt collection visits and promises to pay", "Review how field visits can document whether a payment was collected, partially collected, promised, disputed, refused or could not be completed. A repayment promise should retain its amount, agreed date and follow-up status.", ["Is each visit linked to the correct customer and responsible collector?", "Was payment collected in full, in part, or not collected?", "If payment was promised, are the promised amount and date recorded?", "How are missed promises, disputes and unresolved visits followed up?"]),
        topic("Transaction disputes and supporting evidence", "Understand how disputed or unusual transactions should be documented with their reference, payment channel, status, explanation and supporting evidence so reviewers can investigate without losing the original record.", ["Can the transaction be identified by its original reference and channel?", "What exactly is disputed: amount, recipient, settlement, timing or authorisation?", "Is relevant proof retained and linked to the transaction?", "Who reviews the case and records its outcome?"]),
      ]},
      { title: "Payments, accounts and reconciliation", description: "Follow money across payment channels and account records, then investigate differences between expected and actual balances.", items: [
        topic("Payment channels and transaction processing", "Understand how cash, mobile money, bank transfers, cards, cheques and other payment channels create different records, settlement times, charges and risks.", ["Which payment channel was used and what confirmation is available?", "When should the receiving account be credited?", "Which fees, limits or processing delays apply?", "How are failed, pending and reversed payments communicated and recorded?"]),
        topic("Transaction reconciliation and settlement", "Compare internal transaction records with bank statements, mobile money reports, provider settlements and cash counts. Reconciliation should explain differences instead of forcing totals to match.", ["What total was expected for the period and channel?", "What amount actually settled and on what date?", "Are fees, reversals, timing differences and pending transactions separated?", "Who reviews and signs off unresolved differences?"]),
        topic("Account balances and ledger management", "Understand opening balances, debits, credits, running balances, account statements and the relationship between individual transaction records and account totals.", ["Does every balance have a defined account, owner and reporting date?", "Can the closing balance be reproduced from the opening balance and recorded movements?", "Are corrections supported by an authorised adjustment entry?", "Do sub-ledgers and summary balances agree?"]),
        topic("Cash handling and daily balancing", "Establish clear procedures for receiving, holding, transferring and handing over physical cash, including opening floats, receipts, cash counts and end-of-day balancing.", ["Who was responsible for the cash at each stage?", "Does the physical count agree with the recorded cash position?", "Are shortages and overages documented and investigated?", "Are handovers, safe custody and bank deposits evidenced?"]),
        topic("Foreign exchange operations and multi-currency records", "Understand how a foreign-exchange transaction records the client, currencies exchanged, amount, applied exchange rate, converted amount and supporting note. Rate information should be time-stamped and distinguished from the rate ultimately agreed with the customer.", ["Which currency is being sold and which is being received?", "What exchange rate and rate source apply to the transaction?", "Does the converted amount match the recorded rate and original amount?", "Can the operation be traced in customer history and financial reports?"]),
      ]},
      { title: "Income, expenses and cash-flow management", description: "Understand money earned, money spent, upcoming obligations and the timing of cash available to operate.", items: [
        topic("Business income and revenue records", "Record income from sales, fees, service charges, commissions, interest or other legitimate activities in a way that identifies its source, date and supporting transaction.", ["What activity generated the income?", "Has the amount been received, invoiced or only expected?", "Are refunds, reversals, discounts and applicable charges accounted for?", "Can reported revenue be traced to supporting transactions?"]),
        topic("Business expenses and cost control", "Classify operating expenses and other payments so that managers can see where funds are being used and identify unusual or rising costs.", ["What was purchased or paid for, and for which business purpose?", "Is there an invoice, receipt or other supporting evidence?", "Was the expenditure within an approved budget or authority limit?", "Are recurring costs, cash expenses and one-off purchases reviewed separately?"]),
        topic("Cash-flow management and liquidity", "Understand the timing of cash inflows and outflows, forecast upcoming needs and identify possible shortages before they disrupt operations.", ["What funds are available now across cash and operating accounts?", "Which receipts and payments are expected and when?", "Can the organisation meet payroll, supplier, customer and repayment obligations on time?", "How would a delayed settlement or unexpected expense affect the cash position?"]),
        topic("Budgeting and financial planning", "Use realistic budgets and spending plans to set expectations, allocate resources and compare actual performance against approved plans.", ["Are assumptions and planning periods clearly documented?", "Which costs are fixed, variable or sensitive to transaction volume?", "Where do actual results differ materially from the budget?", "What corrective action is appropriate and who is responsible?"]),
        topic("Loan partner marketplace and application tracking", "Understand how financial institutions and borrowers can review available lending partners, compare published loan ranges and terms, submit an application through the responsible lender and retain a tracking reference. A marketplace listing is not a loan approval or a guarantee of funding.", ["Is the lender authorised and currently available on the marketplace?", "Are loan range, rate, eligibility conditions and other terms clear?", "Does the application continue on the lender's official application channel?", "Is the application reference retained for follow-up and status enquiries?"]),
      ]},
      { title: "Financial records and reporting", description: "Maintain records that can be checked, explained and used to support responsible financial decisions.", items: [
        topic("Financial recordkeeping and documentation", "Organise transaction references, receipts, invoices, statements, approvals and supporting documents so that each reported amount can be checked.", ["Is each record complete, dated and linked to a source transaction?", "Are corrections and adjustments traceable to the original entry?", "Who can access, amend and retain the records?", "How long should different records be retained under applicable rules?"]),
        topic("Daily financial reports and statements", "Understand daily transaction summaries, cash positions, settlement reports, account statements and exception reports used to review operations.", ["Does the report state its period, scope and source?", "Are totals separated by branch, agent, channel or account where necessary?", "Are pending items and unresolved differences visible?", "Can the report be reconciled to underlying transaction records?"]),
        topic("Financial statements and management reporting", "Learn how income and expense summaries, balance information and cash-flow reports provide different views of financial performance and position.", ["What period does the report cover and what accounting basis is used?", "Does a surplus or profit correspond to cash actually available?", "Are assets, liabilities, income and expenses classified consistently?", "Which limitations or missing records should accompany the report?"]),
        topic("Financial performance indicators", "Understand measures such as income and expense trends, liquidity, operating costs, repayment performance, arrears and transaction volumes without treating one metric as a complete picture.", ["Is the measure clearly defined and consistently calculated?", "Does it compare similar periods, products and service points?", "What underlying factors explain a change in the metric?", "Could the indicator create a misleading impression when viewed alone?"]),
      ]},
      { title: "Controls, risk and institutional oversight", description: "Protect funds and records through clear authority, review, accountability and appropriate regulatory awareness.", items: [
        topic("Approvals and separation of financial duties", "Understand why transaction initiation, verification, approval, payment and reconciliation should be assigned carefully, especially for sensitive or high-value actions.", ["Who may initiate, verify and approve a transaction?", "Are approval limits appropriate to value and risk?", "Can a person approve their own transaction without independent review?", "Are overrides and emergency approvals documented?"]),
        topic("Fraud indicators and irregular transaction review", "Recognise why duplicate payments, unusual transaction patterns, unexplained reversals, altered records and unexplained cash differences require careful review and documented escalation.", ["What makes the activity unusual compared with the expected process?", "Can the original evidence and transaction history be preserved?", "Who is authorised to investigate and escalate the concern?", "Has the issue been resolved, referred or left open with a clear owner?"]),
        topic("Loan portfolio and arrears monitoring", "Understand how institutions review outstanding loan balances, scheduled repayments, arrears, rescheduling, concentration and portfolio quality over time.", ["What proportion of the portfolio is current or overdue?", "Are arrears grouped consistently by age and product?", "Are rescheduled loans reported separately?", "What evidence supports the explanation for changes in portfolio quality?"]),
        topic("Regulatory records and financial reporting obligations", "Understand why regulated financial organisations maintain accurate records, follow reporting calendars and confirm obligations with the relevant supervisory authority.", ["Which regulator and rules apply to the institution and its activities?", "What reports, formats and deadlines are prescribed?", "Are reported figures supported by reconciled records?", "Who reviews updates to applicable regulatory requirements?"]),
        topic("Customer information, permissions and audit trails", "Protect customer and member information through controlled access, secure record handling, traceable changes and clear responsibilities for data use.", ["Which staff roles need access to each type of information?", "Are access changes made promptly when responsibilities change?", "Can the organisation identify who viewed or changed a sensitive record?", "Are privacy, retention and security obligations documented?"]),
      ]},
    ],
    sources: [
      { name: "Bank of Ghana", scope: "Financial-sector supervision, payment systems and notices for regulated institutions and payment service providers", type: "Official national regulator", url: "https://www.bog.gov.gh/" },
      { name: "Ghana Financial Intelligence Centre", scope: "Anti-money-laundering and counter-terrorist-financing guidance and reporting information", type: "Official national authority", url: "https://fic.gov.gh/" },
      { name: "CGAP", scope: "Research and practical guidance on financial inclusion, microfinance and digital financial services", type: "International development research centre", url: "https://www.cgap.org/" },
      { name: "IFRS for SMEs", scope: "Financial reporting requirements designed for eligible small and medium-sized entities", type: "Official international accounting standard", url: "https://www.ifrs.org/issued-standards/ifrs-for-smes/" },
    ],
    product: { label: "Open Sikasɛm", href: "https://ops.amineva.com", description: "Open Sikasɛm to explore financial-network transaction monitoring, field collection, float tracking, reconciliation and operational oversight." },
  },
    slug: "agriculture-climate-intelligence", title: "Agriculture and Climate Intelligence", icon: Sprout,
    summary: "Understand local weather, seasonal climate risks, land and water conditions, crop suitability, satellite observations, farm operations, agricultural logistics and markets.",
    purpose: "Agriculture is shaped by decisions that are connected: where to farm, what to grow, when to plant, how to manage water and inputs, how to recognise field risks, and how to store, move and sell produce. This area explains how weather observations, forecasts, long-term climate patterns, land characteristics, field records, remote-sensing indicators and market information can support those decisions. Every dataset has limits: a forecast is not an observation, a satellite signal is not a field diagnosis, and regional averages do not replace local knowledge or inspection.",
    sections: [
      { title: "Weather, climate and seasonal risk", description: "Understand the difference between current conditions, forecasts and longer-term climate patterns—and how each affects farm decisions.", items: [
        topic("Local weather observations and forecasts", "Understand how temperature, rainfall, humidity, wind and short-range forecasts relate to a specific farm location. Check the time, location, source and forecast horizon before using a weather value to plan field work.", ["Is this a measured observation, a forecast or a model estimate?", "How close is the source location or grid cell to the farm?", "When was the information updated and how far ahead does it apply?", "What weather conditions could interrupt planting, spraying, harvesting or transport?"]),
        topic("Rainfall patterns and water availability", "Examine the timing, intensity and distribution of rainfall rather than relying only on seasonal totals. Connect rainfall information with soil conditions, water storage, irrigation access and crop water requirements.", ["Did rain arrive at the right growth stage or outside the useful planting window?", "Are rainfall totals hiding long dry spells or intense runoff events?", "What water sources are available during dry periods?", "Could drainage, erosion or waterlogging affect the field?"]),
        topic("Temperature, humidity and growing conditions", "Explore how heat, cold, humidity and day-to-day variation can affect crop development, livestock comfort, disease pressure and post-harvest handling.", ["Which temperature range matters for the selected crop or livestock?", "Are high daytime temperatures or warm nights creating additional stress?", "How might humidity affect disease pressure or stored produce?", "Are the observations representative of the farm's microclimate?"]),
        topic("Seasonal climate patterns and planting windows", "Use seasonal outlooks and historical climate patterns to understand likely periods of rainfall, dry conditions and temperature changes. Treat outlooks as probabilities rather than guarantees.", ["What is the expected start and end of the local rainy season?", "How much uncertainty is present in the seasonal outlook?", "Which crop duration fits the likely growing period?", "What alternative plan is available if the rains start late or end early?"]),
        topic("Drought, heat, flood and extreme-weather risks", "Identify weather-related hazards that can affect crops, livestock, farm infrastructure and supply routes. Assess exposure and practical preparedness instead of interpreting a risk indicator as proof that a loss will occur.", ["Which fields, water sources, animals or facilities are most exposed?", "What warning signs or official advisories should be monitored?", "Are drainage, water storage, shade or contingency plans adequate?", "How will damage and recovery needs be recorded after an event?"]),
      ]},
      { title: "Land, soil, water and satellite observations", description: "Evaluate the physical characteristics of a farm site and use mapping or remote-sensing information as evidence to investigate—not as a substitute for field checks.", items: [
        topic("Land suitability and site selection", "Assess whether a proposed location is suitable for a crop or farming activity by considering terrain, soil, drainage, water access, climate, land use and practical access.", ["Is the land legally and practically available for the intended use?", "What slope, drainage and erosion constraints exist?", "Can water, labour, inputs and transport reach the site?", "Which risks require a field survey or local authority check?"]),
        topic("Soil properties and field conditions", "Understand soil texture, structure, depth, organic matter, pH, fertility and drainage, and how sampling and field observations help establish the conditions within a farm.", ["Has soil been sampled at representative points and depths?", "Are pH, nutrient status and texture known or assumed?", "Do compaction, erosion, salinity or waterlogging need attention?", "Which conclusions require laboratory testing or extension advice?"]),
        topic("Water resources and irrigation planning", "Examine water sources, seasonal availability, irrigation access, storage, distribution and the water needs of different crops and growth stages.", ["Is the water source reliable through the dry season?", "Does the water quality suit the crop and irrigation method?", "How much water is needed at each growth stage?", "Are pumping, storage and distribution costs sustainable?"]),
        topic("Farm mapping and field boundaries", "Use coordinates, maps and consistent field identifiers to describe farm boundaries, access routes, water points and production areas. Verify mapped boundaries and ownership or access rights on the ground.", ["Are coordinates recorded in the correct reference system?", "Do mapped boundaries match the land actually managed?", "Are neighbouring plots, access roads and water points identified?", "Can each field be linked to its crop, records and activities?"]),
        topic("Satellite imagery and land-cover change", "Learn how satellite imagery can help monitor vegetation, land cover, surface conditions and changes over time. Consider acquisition date, resolution, cloud cover, season and sensor limitations.", ["Which satellite or sensor produced the image?", "When was the image acquired and what is its spatial resolution?", "Could cloud, shadows, seasonality or recent land disturbance affect interpretation?", "What field observations are needed to confirm an apparent change?"]),
        topic("Vegetation indicators and crop-stress investigation", "Understand vegetation indices and other remote-sensing indicators as signals that may help identify areas for closer inspection. Different crops, growth stages, soil backgrounds and weather conditions can change how these signals appear.", ["Which index or indicator is being interpreted and what does it measure?", "Is the comparison made against a suitable crop stage and baseline?", "Could bare soil, mixed vegetation, cloud or water affect the reading?", "Has the flagged area been checked through field scouting or other evidence?"]),
      ]},
      { title: "Crop, livestock and farm operations", description: "Connect production plans, crop calendars, field activities, farm inputs and observations across the production cycle.", items: [
        topic("Crop selection and site-specific suitability", "Compare crop requirements with local climate, soil, water, terrain, growing duration, labour and market access before committing resources.", ["Does the crop fit the local rainfall and temperature pattern?", "Are soil, water and growing-period requirements understood?", "Can the farm obtain suitable seed, inputs and technical support?", "Is there a reliable market or use for the expected harvest?"]),
        topic("Planting calendars and crop growth stages", "Plan land preparation, planting, field operations and harvesting around crop duration, local seasonal conditions and the development stage of the crop.", ["What planting window is appropriate for this location and variety?", "How long does the crop typically take to mature under local conditions?", "Which activities must happen at each growth stage?", "What changes if planting is delayed or weather conditions shift?"]),
        topic("Farm records and production planning", "Keep dated records of fields, crops, varieties, planting, labour, inputs, treatments, field observations and harvests so that results can be reviewed across seasons.", ["Does every activity identify the field, date and responsible person?", "Are input quantities and application dates recorded?", "Can harvest results be compared with the activities and conditions that preceded them?", "Which records are missing or difficult to verify?"]),
        topic("Pest, disease and field scouting", "Understand monitoring, early warning signs, field scouting and integrated pest-management principles. Symptoms and risk alerts should lead to inspection and, where necessary, qualified diagnosis before treatment decisions.", ["What symptoms or pest evidence were observed, and on which crop stage?", "How widespread is the issue and how quickly is it changing?", "Could weather, nutrient stress or another cause produce similar symptoms?", "What local extension or plant-health authority can confirm the diagnosis and appropriate response?"]),
        topic("Livestock and aquaculture conditions", "Consider how weather, water, feed, housing, hygiene, stocking density and routine observation affect animal welfare and production in livestock and aquaculture systems.", ["Are temperature, ventilation and water conditions suitable for the species?", "Are feed, water quality and stocking levels monitored?", "Are unusual symptoms or mortality recorded and referred for qualified assessment?", "What contingency is available during heat, flooding or water-quality problems?"]),
      ]},
      { title: "Farm inputs, post-harvest and agricultural logistics", description: "Manage the resources and practical movement of agricultural inputs and produce from supply through harvest, storage and delivery.", items: [
        topic("Seeds, fertiliser and farm-input management", "Plan the procurement, storage, use and tracking of seeds, fertiliser, crop-protection products, animal feed and other farm inputs.", ["Are inputs suitable for the crop, soil and intended use?", "Are batch numbers, quantities, purchase dates and expiry dates recorded?", "Are storage conditions and safe handling requirements followed?", "Can planned input use be reconciled with actual field application?"]),
        topic("Farm inventory and resource control", "Maintain visibility over input quantities, equipment, tools and consumables so that shortages, damage, expiry and unusual usage can be identified early.", ["What is in stock, where is it stored and who is responsible?", "Which inputs are nearing their reorder point or expiry date?", "Are issues to field teams recorded against a farm or activity?", "Can losses and adjustments be explained and approved?"]),
        topic("Harvest planning and labour coordination", "Estimate harvest timing and resource needs using crop maturity, field observations, labour, equipment, packaging, storage and buyer arrangements.", ["Which fields are approaching harvest and what evidence supports the estimate?", "Are labour, equipment, crates and transport available on time?", "Can harvesting be staged to avoid congestion or quality loss?", "Are quantities and quality recorded at collection?"]),
        topic("Post-harvest handling, storage and food quality", "Understand how sorting, cleaning, drying, cooling, packaging, storage and handling affect quality, safety and losses after harvest.", ["What temperature, humidity and ventilation conditions are suitable for the produce?", "Are damaged or contaminated products separated?", "Can batches be traced from field to storage or buyer?", "Where do handling delays or poor storage cause avoidable losses?"]),
        topic("Agricultural transport and supply-chain logistics", "Plan how inputs and harvested produce move between suppliers, farms, aggregation points, storage facilities, processors and buyers. Consider timing, route access, load capacity and handling requirements.", ["When must inputs arrive to avoid interrupting farm activities?", "Can roads and routes support the vehicle and load during the season?", "Are delivery quantities, destinations and handovers documented?", "How are delays, losses and changes in delivery recorded?"]),
      ]},
      { title: "Markets, costs and farm business decisions", description: "Relate production plans to prices, costs, buyers, records and the commercial decisions that affect farm sustainability.", items: [
        topic("Agricultural market prices and price comparisons", "Compare commodity prices by product, grade, unit, market, location and observation date. Distinguish farm-gate, wholesale and retail prices before drawing conclusions.", ["Which commodity, variety, grade and unit does the price describe?", "Is the price from the farm gate, an aggregation point or a retail market?", "When and where was the price observed?", "Are transport, quality and seasonal differences affecting the comparison?"]),
        topic("Buyers, suppliers and market access", "Understand how farmers identify buyers and suppliers, assess requirements, negotiate terms and organise collection or delivery.", ["What quality, quantity, packaging and timing does the buyer require?", "Are payment terms and delivery responsibilities clear?", "Can the supplier or buyer be verified and contacted?", "What alternatives exist if the expected buyer cannot collect?"]),
        topic("Cost of production and farm budgeting", "Build a practical picture of seed, fertiliser, labour, machinery, irrigation, storage, transport and other production costs for a crop or production cycle.", ["Have both cash expenses and relevant non-cash resources been considered?", "Are costs recorded per field, crop, hectare or production cycle?", "Which costs are fixed, variable or dependent on yield?", "What happens to the budget if input prices or harvest volumes change?"]),
        topic("Farm revenue, margins and profitability", "Distinguish harvest volume, sales revenue, cash collected, operating costs and profit. Use consistent units and periods when estimating whether an activity is financially sustainable.", ["Does the revenue calculation use sold quantity and actual realised prices?", "Are rejected produce, post-harvest losses and unsold stock included?", "Which costs are missing from the calculation?", "How does the result compare across fields, crops or seasons?"]),
        topic("Agricultural records and decision reporting", "Bring production, input, labour, harvest, storage, transport and sales records together to understand what happened and what should change in the next production cycle.", ["Can each reported quantity be traced to a dated farm record?", "Which indicators help explain yield, quality, cost and delivery performance?", "Are estimates separated from measured results?", "What practical decision should the report support?"]),
      ]},
    ],
    sources: [
      { name: "FAO GIEWS Data and Tools", scope: "Food security, agricultural monitoring and food-price information", type: "Official UN food and agriculture source", url: "https://www.fao.org/giews/data-tools/en/" },
      { name: "NASA POWER", scope: "Meteorological and solar datasets with point and regional temporal services", type: "Public Earth-science data service", url: "https://power.larc.nasa.gov/" },
      { name: "Copernicus Data Space", scope: "Sentinel and other Earth-observation datasets, browser and APIs", type: "Official Earth-observation data access", url: "https://dataspace.copernicus.eu/explore-data" },
    ],
    product: { label: "Explore AgroClimate", href: "https://agro.amineva.com", description: "Continue to AgroClimate to explore weather and climate information, production risk awareness, farm learning and input management tools." },
  },
  {
    slug: "operational-intelligence", title: "Operational Intelligence", icon: ShieldCheck,
    summary: "Understand how organisations establish operational reality, verify records, investigate exceptions, strengthen controls and confirm that decisions produce results.",
    purpose: "Most organisations have information spread across people, processes, documents, transactions and separate systems. A report may say a task is complete while supporting evidence is missing; two systems may show different balances; an approval may not match the person authorised to give it; or a recurring exception may remain unresolved. Operational Intelligence is the discipline of bringing those facts together. It helps an organisation establish what is known, what conflicts, what is missing, who is responsible and what needs to happen next. Reliable findings require authorised access, traceable evidence, clear criteria and accountable human review.",
    sections: [
      { title: "Operational reality and process mapping", description: "Build a structured picture of how work actually moves through an organisation, not only how a policy says it should work.", items: [
        topic("Reality Mapping", "Create a structured picture of processes, systems, records, activities, responsibilities, dependencies and relationships. Map the real flow of work, including informal hand-offs and exceptions.", ["Which process or business outcome is being examined?", "Which people, systems, records and external parties participate?", "Where are the hand-offs, dependencies, delays and control points?", "What evidence confirms that the documented process matches actual practice?"]),
        topic("Process mapping and workflow analysis", "Trace a task from request to completion, showing decisions, approvals, queues, handovers, systems and possible failure points.", ["What starts the process and what counts as completion?", "Which steps, decisions and handovers occur in practice?", "Where do delays, rework or undocumented workarounds occur?", "Which records can confirm the timing and completion of each step?"]),
        topic("Roles, responsibilities and accountability mapping", "Clarify who owns a process, who performs each activity, who approves exceptions and who is accountable for the resulting outcome.", ["Is there one clearly accountable owner for each critical process?", "Are responsibilities understood by the people performing the work?", "Where can duties overlap, conflict or be left unassigned?", "Who resolves a hand-off when the receiving team does not accept it?"]),
        topic("Systems, dependencies and service relationships", "Identify the applications, infrastructure, suppliers, data feeds and people that a critical business process depends on.", ["Which systems or providers are essential for the process to function?", "What happens when a dependency is delayed or unavailable?", "Are ownership, support contacts and recovery arrangements documented?", "Can the organisation trace an operational outcome across those dependencies?"]),
      ]},
      { title: "Records, evidence and cross-system verification", description: "Determine whether records support the claims being made, retain their context and reconcile differences without hiding unresolved issues.", items: [
        topic("Cross-System Verification", "Compare authorised records across systems to identify contradictions, missing information and discrepancies. Use shared identifiers, date ranges and defined comparison rules.", ["Which source system owns each field or transaction?", "Do record identifiers, dates, quantities and status agree?", "Could timing, duplicate events or incomplete synchronisation explain the difference?", "Who is authorised to resolve and approve a correction?"]),
        topic("Evidence Intelligence", "Examine documents, transactions, communications and records while retaining their origin, date, context, completeness and relationship to the claim being reviewed.", ["Who created the evidence and when?", "Does it directly support the claim or only provide background?", "Is it original, copied, incomplete, disputed or unverified?", "Can another reviewer reproduce the path from claim to evidence?"]),
        topic("Record reconciliation", "Compare records using common identifiers, defined tolerances and a documented review period. Separate genuine differences from timing, classification or data-entry issues.", ["What is the comparison key and reporting period?", "Which differences are material and which are expected timing differences?", "Are missing, duplicated or unmatched records visible?", "Who reviews and documents the resolution of each exception?"]),
        topic("Data quality and ownership", "Define who owns important data, where it originates, how it is validated and how errors or conflicting versions are corrected.", ["Is there a clear owner for each critical dataset or field?", "Are definitions, units and identifiers consistent across teams?", "How are incomplete, stale or duplicated records identified?", "Are data corrections traceable to an authorised person and reason?"]),
        topic("Document control and audit trails", "Maintain traceable versions of important records, approvals and changes so reviewers can establish what existed at a particular time and who changed it.", ["Can the original record and later versions be retrieved?", "Who accessed, created, amended or approved the record?", "Are retention and access rules defined for the record type?", "Are backups and recovery tests appropriate to the risk?"]),
      ]},
      { title: "Controls, risks and exception management", description: "Identify where work can fail, be misused or become unreliable, then design proportionate checks and follow-up.", items: [
        topic("Continuous Anomaly Detection", "Identify unusual patterns and changes in connected, authorised operational data. Treat alerts as signals for review until the facts and impact have been established.", ["What is the normal baseline and which period does it represent?", "What changed, when and in which system or process?", "Could seasonality, a legitimate one-off event or poor data explain the signal?", "Is the alert confirmed, a risk indicator or an item awaiting investigation?"]),
        topic("Control design and effectiveness testing", "Design checks that prevent, detect or correct important errors, then test whether the controls work in normal operations and under exception conditions.", ["Which risk is the control intended to address?", "Who performs the control and who reviews it?", "Is there evidence that the control operated during the period?", "Have failed or bypassed controls been investigated and improved?"]),
        topic("Access, permissions and change management", "Ensure access to systems and sensitive actions is appropriate to a person's role, approved, reviewed and removed when no longer needed.", ["Who has access to critical systems and why?", "Are privileged actions and changes logged and reviewed?", "Are staff transfers and departures reflected promptly in permissions?", "Can emergency access be granted and then independently reviewed?"]),
        topic("Incident and exception management", "Record operational incidents, unusual transactions, failed processes and policy exceptions from detection through investigation, ownership, resolution and review.", ["How is an incident identified and recorded?", "Who assesses severity and assigns an accountable owner?", "Are evidence, decisions and communications retained?", "What confirms that the issue is resolved and recurrence risk is addressed?"]),
        topic("Third-party and supplier oversight", "Monitor services and commitments provided by suppliers, contractors and external partners, including performance, access, dependencies and unresolved obligations.", ["What service, delivery or security commitments were agreed?", "Which evidence demonstrates that the supplier met them?", "What access does the third party have to organisational systems or information?", "What contingency exists if the service fails or the supplier becomes unavailable?"]),
      ]},
      { title: "Decisions, corrective action and outcome verification", description: "Move from an identified issue to a documented decision, an owned action and evidence that the intended result was achieved.", items: [
        topic("Outcome Verification", "Check whether instructions, decisions, transactions, projects and corrective actions were completed and achieved their intended result. Completion status alone is not proof of an effective outcome.", ["What outcome was expected and what standard defines success?", "What evidence proves that the work was completed?", "Did the result meet the intended standard and resolve the original issue?", "Who independently confirms closure where the risk requires it?"]),
        topic("Responsibility and approval trails", "Trace decisions, approvals, delegation, handovers and accountability across the full life of an activity or transaction.", ["Was the approver authorised at the time of the decision?", "Is the approval linked to the actual transaction or work item?", "Can later changes, overrides or reversals be traced?", "Who accepted responsibility for the resulting action?"]),
        topic("Corrective-action tracking", "Follow a finding through assignment, due date, action plan, evidence of completion and outcome review. A task should not be closed only because someone marked it complete.", ["Who owns the action and when is it due?", "What evidence is required to demonstrate completion?", "Who validates that the underlying cause or risk was addressed?", "What happens when an action is overdue or ineffective?"]),
        topic("Root-cause analysis and recurring failures", "Investigate why an issue occurred, distinguish symptoms from underlying causes and identify conditions that allow the same failure to recur.", ["What happened and what is the verified sequence of events?", "Which process, system, training or control conditions contributed?", "Which evidence supports or challenges each proposed cause?", "How will the organisation test whether the corrective measure prevents recurrence?"]),
        topic("Decision logs and escalation management", "Keep a clear record of important operational decisions, the evidence considered, the person responsible, alternatives, conditions and any required escalation.", ["What decision was made and by whom?", "Which evidence and assumptions supported the decision?", "Were risks, dissenting views and alternatives documented?", "Who must be informed and what event triggers escalation or review?"]),
      ]},
      { title: "Performance, governance and operational resilience", description: "Use reliable measures and management review to improve performance while maintaining accountability and continuity.", items: [
        topic("Operational performance indicators and service levels", "Define measures for quality, timeliness, cost, reliability and service outcomes. Indicators should have clear definitions and traceable source records.", ["What outcome is the indicator intended to measure?", "Are numerator, denominator, period and exclusions clearly defined?", "Can the reported figure be reproduced from source records?", "Does the service level reflect customer or operational needs?"]),
        topic("Management reviews and operational reporting", "Bring process results, unresolved exceptions, risks, control performance and corrective actions into a review that supports timely decisions.", ["Which matters require management attention this period?", "Are actual results compared with relevant targets and previous periods?", "Are estimates, missing data and unresolved issues clearly identified?", "Are decisions assigned to owners with due dates and follow-up?"]),
        topic("Policy compliance and obligation monitoring", "Translate relevant policies, contracts and regulatory obligations into practical responsibilities, evidence requirements and review schedules.", ["Which obligations apply to the organisation and its jurisdiction?", "Who owns each obligation and how is compliance demonstrated?", "How are policy changes communicated and implemented?", "What happens when a breach or missed obligation is identified?"]),
        topic("Business continuity and operational resilience", "Identify critical activities, dependencies, recovery priorities and alternative arrangements for disruption involving people, facilities, suppliers, systems or infrastructure.", ["Which services must continue and within what recovery time?", "What data, equipment and people are essential to recovery?", "Have backup and continuity arrangements been tested?", "Who activates the response and communicates with affected stakeholders?"]),
        topic("Operational governance and improvement cycles", "Establish a recurring method for reviewing performance, risks, control quality, decisions and improvement actions so that changes are sustained.", ["Who oversees the operational governance process?", "How often are results, risks and controls reviewed?", "Are improvement actions funded, assigned and measured?", "How does leadership confirm that changes produced lasting improvement?"]),
      ]},
    ],
    sources: [
      { name: "ACFE / COSO Fraud Risk Management", scope: "Fraud governance, assessment, controls, investigation and monitoring", type: "Professional control guidance", url: "https://www.acfe.com/fraud-resources/fraud-risk-tools---coso/fraud-risk-management-guide" },
      { name: "NIST Cybersecurity Framework 2.0", scope: "Govern, identify, protect, detect, respond and recover outcomes for cybersecurity risk", type: "Official standards guidance", url: "https://www.nist.gov/cyberframework" },
      { name: "ISO 31000 Risk Management", scope: "Principles and guidance for managing organisational risk", type: "International standards guidance", url: "https://www.iso.org/iso-31000-risk-management.html" },
    ],
  },
];

const HERO_SCENES = [
  { label: "Knowledge", line: "Explore the subjects, evidence and decisions that shape education, work, organisations and everyday life.", bg: "radial-gradient(circle at 20% 30%, hsl(var(--accent) / 0.35), transparent 55%), linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))" },
  { label: "World & places", line: "Learn about countries, cultures, history and how the world works.", bg: "radial-gradient(circle at 80% 20%, hsl(var(--accent) / 0.3), transparent 50%), linear-gradient(200deg, hsl(var(--primary) / 0.9), hsl(var(--primary)))" },
  { label: "Science & technology", line: "Explore discoveries, inventions and the ideas shaping tomorrow.", bg: "radial-gradient(circle at 50% 100%, hsl(var(--accent) / 0.3), transparent 55%), linear-gradient(160deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))" },
  { label: "People & society", line: "Understand economies, communities, health and everyday life.", bg: "radial-gradient(circle at 10% 90%, hsl(var(--accent) / 0.35), transparent 50%), linear-gradient(110deg, hsl(var(--primary) / 0.85), hsl(var(--primary)))" },
];

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function normalise(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

const SEARCH_STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "can", "do", "does", "for", "from", "how", "i", "in", "is", "it", "of", "on", "or", "the", "to", "what", "when", "where", "which", "who", "why", "with"]);
const FINANCIAL_SEARCH_TERMS: Record<string, string> = {
  "financial-transactions-and-monitoring": "transaction monitoring transaction history deposits withdrawals transfers collections disbursements pending completed failed reversed duplicate transaction reference",
  "mobile-money-agent-transactions-and-float-management": "momo mobile money agent cash float electronic float cash in cash out commissions settlement vendor balances",
  "microcredit-disbursements-and-repayment-tracking": "microcredit micro loan disbursement repayment instalment schedule arrears overdue loan balance collections",
  "savings-contributions-and-member-accounts": "savings deposits contributions susu member account withdrawals payouts account statement",
  "branch-agent-and-service-point-monitoring": "branch monitoring agent oversight teller service point field collector transaction volume daily close",
  "payment-channels-and-transaction-processing": "payments cash mobile money bank transfer card cheque payment provider processing transaction channel",
  "transaction-reconciliation-and-settlement": "reconciliation settlement bank statement momo report provider settlement fees reversal pending variance",
  "account-balances-and-ledger-management": "account balance ledger debit credit opening balance closing balance running balance statement subledger",
  "cash-handling-and-daily-balancing": "cash handling float cash count daily balancing cashbook teller vault cash custody handover shortage overage",
  "business-income-and-revenue-records": "income revenue sales fees commissions service charge interest receipts money received turnover earnings",
  "business-expenses-and-cost-control": "expenses expenditure costs operating costs purchases bills invoices receipts spending cost control",
  "cash-flow-management-and-liquidity": "cash flow liquidity inflow outflow cash forecast working capital funds available cash shortage obligations",
  "budgeting-and-financial-planning": "budget budgeting financial plan forecast budget variance actual versus budget financial planning",
  "financial-recordkeeping-and-documentation": "financial records recordkeeping receipts invoices statements audit trail supporting documents transaction documentation",
  "daily-financial-reports-and-statements": "daily report financial summary transaction summary cash position settlement report account statement exception report",
  "financial-statements-and-management-reporting": "financial statement income statement balance sheet cash flow report management reporting accounts",
  "financial-performance-indicators": "financial KPI indicators liquidity operating cost income expense trends repayment performance arrears portfolio performance",
  "approvals-and-separation-of-financial-duties": "transaction approval authorisation maker checker dual control separation of duties payment approval limits",
  "fraud-indicators-and-irregular-transaction-review": "fraud irregular transaction suspicious activity duplicate payment reversal altered records cash discrepancy investigation",
  "loan-portfolio-and-arrears-monitoring": "loan portfolio arrears portfolio quality non performing loans repayment performance overdue aging rescheduled loan",
  "regulatory-records-and-financial-reporting-obligations": "regulatory reporting compliance central bank supervisor regulator financial returns reporting deadline institution",
  "customer-information-permissions-and-audit-trails": "customer data privacy permissions access control user roles audit logs transaction history data protection",
  "collector-field-operations-and-daily-summaries": "field collector mobile app pwa susu collector daily summary collection record deposit field activity sync customer member",
  "debt-collection-visits-and-promises-to-pay": "debt collection field visit repayment visit payment collected partial payment repayment promised promise to pay follow up refusal dispute",
  "transaction-disputes-and-supporting-evidence": "transaction dispute disputed payment proof upload receipt evidence transaction reference investigation settlement mismatch",
  "foreign-exchange-operations-and-multi-currency-records": "forex foreign exchange currency conversion currency pair exchange rate converted amount client currency history FX",
  "loan-partner-marketplace-and-application-tracking": "loan marketplace lender partner loan application tracking ID loan range rate credit provider borrower application status",
};
const BUSINESS_SEARCH_TERMS: Record<string, string> = {
  "inventory-and-stock-records": "stock register stock ledger stock balance stock movement goods received dispatch stock control storekeeping",
  "product-catalogues-and-stock-classification": "SKU barcode product code item master product catalogue product category variant unit of measure UOM duplicate item",
  "stocktaking-and-discrepancies": "stock count physical inventory count stocktake stock variance stock adjustment inventory discrepancy reconciliation",
  "stock-valuation-and-cost-of-goods-sold": "FIFO weighted average cost WAC closing stock inventory value COGS cost of sales valuation gross profit",
  "reorder-levels-and-stock-replenishment": "reorder point minimum stock maximum stock safety stock low stock alerts purchase planning lead time replenishment",
  "loss-damage-expiry-and-shrinkage": "stock loss theft wastage expired goods damaged goods inventory shrinkage write off expiry control",
  "purchasing-and-supplier-records": "purchase order PO supplier invoice goods received note GRN delivery note procurement supplier balance vendor management",
  "sales-and-transaction-records": "point of sale POS till sales receipt invoice cash card mobile money momo bank transfer discounts voids daily sales",
  "cash-bank-and-mobile-money-reconciliation": "cashbook bank reconciliation bank statement mobile money momo payment settlement transaction matching payment fees reversals",
  "returns-refunds-and-transaction-adjustments": "sales return refund reversal void credit note stock return transaction correction exchange adjustment approval",
  "receipts-invoices-and-document-control": "receipt tax invoice proforma invoice delivery note debit note credit note document management missing invoice duplicate receipt",
  "cash-flow-management-and-forecasting": "cash flow forecast cash inflow cash outflow liquidity working capital cash shortage cash planning runway",
  "accounts-receivable-and-customer-credit": "accounts receivable debtors debtor ageing outstanding customer balances credit control unpaid invoice collections",
  "accounts-payable-and-supplier-obligations": "accounts payable creditors creditor ageing supplier bills vendor payments outstanding payables due invoices",
  "revenue-expenses-and-operating-margins": "profit and loss P&L income statement gross profit net profit gross margin net margin operating expenses cost of sales revenue",
  "daily-cash-position-and-financial-records": "cashbook petty cash cash float opening balance closing balance daily cash report bank balance account balance cash position",
  "employee-accountability-and-responsibilities": "staff responsibility employee roles duties attendance performance assignment access rights accountability",
  "shift-handovers-and-cash-custody": "shift change handover cash count till float cash custody register key handover pending tasks",
  "approvals-and-separation-of-duties": "approval matrix authorisation limits maker checker segregation of duties purchase approval payment approval delegation",
  "internal-controls-and-loss-prevention": "fraud prevention internal audit control checks exception review unauthorised transactions asset protection",
  "business-records-access-and-audit-trails": "audit log audit trail user activity history record changes permissions data access backup retention",
  "operational-efficiency-and-process-improvement": "workflow process mapping bottleneck delays productivity operating procedure SOP error reduction process improvement",
  "business-performance-indicators-and-kpis": "KPI dashboard key performance indicator stock turnover inventory turnover sales growth gross margin order fulfilment",
  "management-reports-and-business-decisions": "management dashboard business reporting monthly report variance analysis budget versus actual decision support",
};
const TRAVEL_SEARCH_TERMS: Record<string, string> = {
  "country-overview-and-regions": "country profile regions capital geography population demographics city destination national indicators",
  "living-conditions-and-public-services": "living conditions public services healthcare housing utilities internet transport infrastructure",
  "cost-of-living-and-personal-budgets": "cost of living rent groceries monthly budget expenses currency household budget",
  "culture-language-and-local-norms": "language culture customs social norms local etiquette",
  "accommodation-and-neighbourhood-selection": "rent accommodation apartment neighbourhood lease tenancy deposit landlord",
  "transport-geography-and-local-movement": "public transport local transit taxi roads commute distance route city",
  "visa-and-entry-requirements": "visa free visa requirement passport nationality entry permit travel authorisation ETA e visa immigration",
  "official-application-process": "visa application embassy consulate immigration application fee appointment document checklist",
  "embassies-and-consular-support": "embassy consulate high commission consular services passport emergency mission",
  "travel-advisories-and-health-requirements": "travel advisory safety notice health alert vaccination yellow fever health certificate",
  "passport-validity-and-supporting-documents": "passport expiry validity blank pages supporting documents invitation proof funds",
  "transit-stopovers-and-connecting-flights": "transit visa airport connection layover stopover airside baggage transfer",
  "travel-insurance-and-trip-protection": "travel insurance medical evacuation trip cancellation baggage delay policy exclusions",
  "employment-and-unemployment": "jobs employment labour market unemployment wages work permit sponsorship vacancies",
  "education-and-study-opportunities": "study abroad university college international student tuition admission scholarship",
  "discrimination-racism-and-inclusion": "racism discrimination inclusion equality human rights social conditions protections",
  "laws-rights-and-responsibilities": "local laws legal rights responsibilities foreign nationals tenancy employment driving",
  "residence-permits-and-long-term-stay": "residence permit residency permanent residence temporary residence citizenship renewal",
  "recognition-of-qualifications-and-professional-licensing": "qualification recognition credential evaluation professional licensing regulated profession",
  "healthcare-access-and-medical-preparation": "healthcare hospital clinic medical treatment medicine prescription vaccination",
  "emergency-services-and-incident-response": "emergency number police ambulance fire emergency contact incident response",
  "personal-safety-and-local-risk-awareness": "personal safety crime scams travel risk local security demonstrations",
  "accessibility-and-special-travel-needs": "accessibility disability mobility assistance special needs accessible transport accommodation",
  "itinerary-distance-and-seasonal-planning": "travel itinerary route distance seasonal travel public holidays opening hours",
  "currency-payments-and-financial-access": "currency exchange rate foreign exchange card cash payments bank fees",
  "phone-internet-and-digital-connectivity": "SIM eSIM roaming internet mobile phone connectivity network",
  "booking-checks-and-departure-preparation": "flight booking hotel reservation baggage check in departure checklist documents",
};
const OPERATIONAL_SEARCH_TERMS: Record<string, string> = {
  "reality-mapping": "operational reality business process mapping system records dependencies workflows",
  "process-mapping-and-workflow-analysis": "workflow process flow bottleneck handoff process map",
  "roles-responsibilities-and-accountability-mapping": "responsibility RACI accountable owner staff roles duties",
  "systems-dependencies-and-service-relationships": "system dependency supplier service provider integration continuity",
  "cross-system-verification": "cross system reconciliation data matching record discrepancy",
  "evidence-intelligence": "evidence documents records provenance verification source context",
  "record-reconciliation": "reconcile records transaction matching ledger discrepancy variance",
  "data-quality-and-ownership": "data quality ownership stale incomplete duplicate data governance",
  "document-control-and-audit-trails": "document version control audit trail change history access log",
  "continuous-anomaly-detection": "anomaly detection unusual transaction pattern exception monitoring",
  "control-design-and-effectiveness-testing": "internal controls control testing prevention detection effectiveness",
  "access-permissions-and-change-management": "user access permissions privileged access change management",
  "incident-and-exception-management": "incident log exception register issue escalation resolution",
  "third-party-and-supplier-oversight": "vendor supplier oversight SLA third party risk",
  "outcome-verification": "outcome verification proof of completion performance result",
  "responsibility-and-approval-trails": "approval trail authorisation delegation approval matrix",
  "corrective-action-tracking": "corrective action CAPA action plan remediation due date",
  "root-cause-analysis-and-recurring-failures": "root cause analysis RCA recurring issue five whys",
  "decision-logs-and-escalation-management": "decision log escalation governance decision record",
  "operational-performance-indicators-and-service-levels": "operational KPI service level SLA performance indicator",
  "management-reviews-and-operational-reporting": "management report operational review executive dashboard",
  "policy-compliance-and-obligation-monitoring": "compliance policy regulatory obligation monitoring audit",
  "business-continuity-and-operational-resilience": "business continuity disaster recovery resilience recovery plan",
  "operational-governance-and-improvement-cycles": "operational governance continuous improvement review cycle",
};
const AGRICULTURE_SEARCH_TERMS: Record<string, string> = {
  "local-weather-observations-and-forecasts": "weather forecast rain forecast temperature humidity wind hourly weather local forecast farm weather meteo",
  "rainfall-patterns-and-water-availability": "rainfall rain distribution dry spell water access runoff waterlogging irrigation rainfall total",
  "temperature-humidity-and-growing-conditions": "heat stress humidity temperature range microclimate crop conditions animal comfort",
  "seasonal-climate-patterns-and-planting-windows": "rainy season planting season growing season seasonal outlook onset of rains planting window crop duration",
  "drought-heat-flood-and-extreme-weather-risks": "drought flood heatwave extreme weather storm heavy rain climate hazard farm risk early warning",
  "land-suitability-and-site-selection": "farm site selection land assessment terrain slope drainage land use soil suitability water access",
  "soil-properties-and-field-conditions": "soil test soil sampling pH fertility texture organic matter compaction salinity erosion",
  "water-resources-and-irrigation-planning": "irrigation water source water storage water quality dry season water requirement",
  "farm-mapping-and-field-boundaries": "farm map GPS coordinates field boundary geospatial mapping plot boundary farm location",
  "satellite-imagery-and-land-cover-change": "satellite image remote sensing land cover change earth observation vegetation imagery cloud cover",
  "vegetation-indicators-and-crop-stress-investigation": "NDVI vegetation index crop stress anomaly detection remote sensing crop monitoring",
  "crop-selection-and-site-specific-suitability": "crop selection crop suitability crop requirements variety selection agroecological zone",
  "planting-calendars-and-crop-growth-stages": "planting calendar crop calendar sowing date growth stage maturity harvest window",
  "farm-records-and-production-planning": "farm diary field records farm activity log crop cycle production plan farm management records",
  "pest-disease-and-field-scouting": "pest scouting crop disease symptoms plant health integrated pest management IPM crop protection",
  "livestock-and-aquaculture-conditions": "livestock weather stress animal welfare aquaculture water quality fish farming feed housing",
  "seeds-fertiliser-and-farm-input-management": "seed fertilizer fertiliser agrochemicals feed farm supplies inputs batch expiry stock",
  "farm-inventory-and-resource-control": "farm inventory input stock equipment tools consumables stock register inventory control",
  "harvest-planning-and-labour-coordination": "harvest forecast harvest schedule labour planning equipment harvest volume field maturity",
  "post-harvest-handling-storage-and-food-quality": "post harvest storage drying cooling packaging cold chain food quality loss reduction",
  "agricultural-transport-and-supply-chain-logistics": "farm transport logistics produce delivery aggregation supply chain route planning truck",
  "agricultural-market-prices-and-price-comparisons": "farm gate price wholesale retail commodity market price market information food prices",
  "buyers-suppliers-and-market-access": "buyers suppliers off taker market access contract farming procurement produce sales",
  "cost-of-production-and-farm-budgeting": "farm budget production cost input cost cost per acre cost per hectare labour machinery",
  "farm-revenue-margins-and-profitability": "farm revenue farm income gross margin net profit yield revenue production economics",
  "agricultural-records-and-decision-reporting": "farm dashboard farm reports yield records production reporting harvest report farm performance",
};

function allTopics(category: Category) {
  return category.sections.flatMap(section => section.items.map(item => ({ ...item, section: section.title, slug: slugify(item.title) })));
}

type CrossrefItem = {
  DOI?: string; title?: string[]; author?: { given?: string; family?: string }[];
  "container-title"?: string[]; publisher?: string; URL?: string; type?: string;
  published?: { "date-parts"?: number[][] }; issued?: { "date-parts"?: number[][] };
  abstract?: string;
};
type ResearchRecord = {
  title: string; doi?: string; url?: string; year?: number; authors: string;
  publisher: string; journal: string; abstract: string; type: string;
};

async function searchCrossref(query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const fields = "DOI,title,author,published,issued,publisher,URL,type,container-title,abstract";
  const url = "https://api.crossref.org/works?query.bibliographic=" + encodeURIComponent(query) + "&rows=8&select=" + fields;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Research index returned an error (" + response.status + ").");
  const payload = await response.json();
  const items: CrossrefItem[] = payload?.message?.items || [];
  return items.map(item => {
    const title = item.title?.[0] || "Untitled research record";
    const dateParts = item.published?.["date-parts"]?.[0] || item.issued?.["date-parts"]?.[0] || [];
    const abstract = (item.abstract || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return {
      title, doi: item.DOI, url: item.URL || (item.DOI ? "https://doi.org/" + item.DOI : undefined),
      year: dateParts[0], authors: (item.author || []).slice(0, 4).map(a => [a.given, a.family].filter(Boolean).join(" ")).join(", "),
      publisher: item.publisher || "Publisher not supplied", journal: item["container-title"]?.[0] || "",
      abstract: abstract.slice(0, 620), type: item.type || "Research record",
    };
  });
}

type WBIndicator = { value: number; date: string; footnote?: string };
type IndicatorResult = { data?: WBIndicator; error?: string };
type WBCountry = {
  id: string; iso2Code: string; name: string; capitalCity?: string;
  region?: { id?: string; value?: string }; incomeLevel?: { id?: string; value?: string };
};
type CountryStats = {
  population: IndicatorResult;
  gdp: IndicatorResult;
  unemployment: IndicatorResult;
  lifeExpectancy: IndicatorResult;
};

async function fetchWorldBankIndicator(code: string, indicator: string, signal: AbortSignal): Promise<WBIndicator | undefined> {
  // MRNEV means "most recent non-empty value". MRV=1 can return a null
  // observation and hide an earlier valid year for countries with reporting gaps.
  const url = "https://api.worldbank.org/v2/country/" + encodeURIComponent(code) + "/indicator/" + encodeURIComponent(indicator) + "?format=json&mrnev=1&per_page=1&footnote=y";
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("World Bank returned HTTP " + response.status + " for " + indicator + ".");
  const payload = await response.json();
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) {
    const apiMessage = payload?.[0]?.message?.[0]?.value || payload?.message || "Unexpected response from the World Bank Indicators API.";
    throw new Error(String(apiMessage));
  }
  const row = payload[1].find((item: any) => item && item.value !== null && item.value !== undefined);
  if (!row || !Number.isFinite(Number(row.value))) return undefined;
  return {
    value: Number(row.value),
    date: String(row.date || ""),
    footnote: row.footnote ? String(row.footnote) : undefined,
  };
}

async function fetchCountryStats(code: string, signal: AbortSignal): Promise<CountryStats> {
  const requests = await Promise.allSettled([
    fetchWorldBankIndicator(code, "SP.POP.TOTL", signal),
    fetchWorldBankIndicator(code, "NY.GDP.PCAP.CD", signal),
    fetchWorldBankIndicator(code, "SL.UEM.TOTL.ZS", signal),
    fetchWorldBankIndicator(code, "SP.DYN.LE00.IN", signal),
  ]);
  const toResult = (result: PromiseSettledResult<WBIndicator | undefined>): IndicatorResult => {
    if (result.status === "rejected") {
      const reason = result.reason as Error | undefined;
      return { error: reason?.message || "This indicator could not be retrieved." };
    }
    return result.value
      ? { data: result.value }
      : { error: "No non-empty observation is currently returned for this economy." };
  };
  return {
    population: toResult(requests[0]),
    gdp: toResult(requests[1]),
    unemployment: toResult(requests[2]),
    lifeExpectancy: toResult(requests[3]),
  };
}

const monthOrder = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
type ClimateMonth = { month: string; temperature?: number; precipitation?: number; humidity?: number };
type ClimateResult = { rows: ClimateMonth[]; period?: string; sources: string[]; gridResolution?: string };
async function fetchClimateNormals(latitude: number, longitude: number, signal: AbortSignal): Promise<ClimateResult> {
  const params = new URLSearchParams({
    parameters: "T2M,PRECTOTCORR,RH2M", community: "AG",
    latitude: String(latitude), longitude: String(longitude), format: "JSON",
  });
  const response = await fetch("https://power.larc.nasa.gov/api/temporal/climatology/point?" + params.toString(), { signal });
  if (!response.ok) throw new Error("NASA POWER could not return data for these coordinates (HTTP " + response.status + ").");
  const payload = await response.json();
  if (payload?.messages?.length) throw new Error(payload.messages.map((item: any) => item.message || String(item)).join(" "));
  const data = payload?.properties?.parameter || payload?.parameter || {};
  const cleanValue = (value: unknown): number | undefined => {
    const parsed = Number(value);
    // NASA POWER uses a fill value for missing grid-cell observations.
    return value !== null && value !== undefined && Number.isFinite(parsed) && parsed > -900 ? parsed : undefined;
  };
  const rows = monthOrder.map((code, index) => ({
    month: monthLabels[index],
    temperature: cleanValue(data.T2M?.[code]),
    precipitation: cleanValue(data.PRECTOTCORR?.[code]),
    humidity: cleanValue(data.RH2M?.[code]),
  })).filter(item => [item.temperature, item.precipitation, item.humidity].some(value => value !== undefined));
  const header = payload?.header || {};
  const period = header.start && header.end ? String(header.start) + "–" + String(header.end) : undefined;
  const sources = Array.isArray(header.sources) ? header.sources.map(String) : [];
  const gridResolution = payload?.geometry?.coordinates ? "Nearest NASA POWER grid cell" : undefined;
  return { rows, period, sources, gridResolution };
}

function formatNumber(value?: number | null, digits = 0) {
  if (value === undefined || value === null || !Number.isFinite(value)) return "Not available";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function ResearchPanel({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retrievedAt, setRetrievedAt] = useState("");
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    activeRequest.current?.abort();
    setQuery(initialQuery);
    setRecords([]);
    setRetrievedAt("");
    setError("");
    setLoading(false);
  }, [initialQuery]);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const runSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const clean = query.trim();
    if (clean.length < 3) { setError("Enter at least three characters to search research records."); return; }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");
    setRecords([]);
    setRetrievedAt("");
    try {
      const results = await searchCrossref(clean, controller.signal);
      if (activeRequest.current !== controller) return;
      setRecords(results);
      setRetrievedAt(new Date().toISOString());
      if (!results.length) setError("No matching publication metadata was returned. Try different search terms.");
    } catch (err: any) {
      if (err?.name !== "AbortError" && activeRequest.current === controller) {
        setError(err?.message || "The research index could not be reached. Check the connection and try again.");
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4 text-primary" /> Research publication search</div><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Search Crossref's publisher-deposited scholarly metadata. A DOI or Crossref record confirms that metadata was registered, not that the research findings are correct, independently replicated, peer-reviewed or freely accessible.</p></div>
        <Badge variant="outline">Crossref metadata</Badge>
      </div>
      <form onSubmit={runSearch} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Search a subject, question or research topic" aria-label="Search research publications" />
        <Button type="submit" disabled={loading || query.trim().length < 3} className="sm:min-w-32">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Search</Button>
      </form>
      {error && <p role="status" className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{error}</p>}
      {retrievedAt && <p className="mt-3 text-[11px] text-muted-foreground">Retrieved {new Date(retrievedAt).toLocaleString()} · Metadata source: Crossref REST API · Retrieval time is not publication time.</p>}
      {records.length > 0 && <div className="mt-4 space-y-3">
        {records.map((record, index) => <article key={record.doi || record.url || index} className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{record.year || "Publication year not supplied"}</Badge><span className="text-[11px] text-muted-foreground">{record.type}</span></div>
          <h3 className="mt-2 font-semibold leading-6">{record.url ? <a href={record.url} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{record.title} <ExternalLink className="inline h-3.5 w-3.5" /></a> : record.title}</h3>
          {(record.authors || record.journal || record.publisher) && <p className="mt-1 text-xs leading-5 text-muted-foreground">{[record.authors, record.journal, record.publisher].filter(Boolean).join(" · ")}</p>}
          {record.doi && <p className="mt-1 text-[11px] text-muted-foreground">DOI: <a href={"https://doi.org/" + record.doi} target="_blank" rel="noreferrer" className="font-mono text-primary underline underline-offset-2">{record.doi}</a></p>}
          {record.abstract && <p className="mt-3 text-sm leading-6 text-muted-foreground">{record.abstract}{record.abstract.length >= 620 ? "…" : ""}</p>}
          <p className="mt-3 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">Provenance: metadata deposited with Crossref. Check the publisher's article page for corrections, retractions, study methods, full text and publication status before relying on its conclusions.</p>
        </article>)}
      </div>}
      <p className="mt-4 text-[11px] text-muted-foreground">Crossref API documentation: <a className="underline underline-offset-2" href="https://www.crossref.org/documentation/retrieve-metadata/rest-api/" target="_blank" rel="noreferrer">publisher-deposited metadata and API use</a>.</p>
    </section>
  );
}

function CountryExplorer({ onCountriesLoaded }: { onCountriesLoaded?: (list: WBCountry[]) => void }) {
  const [countries, setCountries] = useState<WBCountry[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [stats, setStats] = useState<CountryStats | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState("");
  const [retrievedAt, setRetrievedAt] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch("https://api.worldbank.org/v2/country?format=json&per_page=400", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("World Bank country directory returned HTTP " + response.status + ".");
        return response.json();
      })
      .then(payload => {
        if (!Array.isArray(payload) || !Array.isArray(payload[1])) {
          throw new Error("The World Bank country directory returned an unexpected response.");
        }
        // Keep economies even when a capital-city field is blank. The API also
        // returns regional and income aggregates, which are excluded here.
        const list = (payload[1] as WBCountry[])
          .filter(item => item?.iso2Code && item?.region?.id && item.region.id !== "NA")
          .sort((a, b) => a.name.localeCompare(b.name));
        if (active) {
          setCountries(list);
          onCountriesLoaded?.(list);
        }
      })
      .catch(err => {
        if (active && err?.name !== "AbortError") setError(err?.message || "Could not load the World Bank country directory.");
      })
      .finally(() => { if (active) setLoadingCountries(false); });
    return () => { active = false; controller.abort(); };
  }, []);

  useEffect(() => {
    if (!countryCode) {
      setStats(null);
      setRetrievedAt("");
      setLoadingStats(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setStats(null);
    setRetrievedAt("");
    setLoadingStats(true);
    setError("");
    fetchCountryStats(countryCode, controller.signal)
      .then(result => {
        if (!active) return;
        setStats(result);
        setRetrievedAt(new Date().toISOString());
      })
      .catch(err => {
        if (active && err?.name !== "AbortError") setError(err?.message || "Could not retrieve country indicators.");
      })
      .finally(() => { if (active) setLoadingStats(false); });
    return () => { active = false; controller.abort(); };
  }, [countryCode]);

  const country = countries.find(item => item.iso2Code === countryCode);
  const indicators = [
    {
      key: "population" as const, label: "Population", code: "SP.POP.TOTL",
      suffix: "", digits: 0, unit: "people",
      description: "Estimated total population. The World Bank series draws on UN population estimates and national statistical sources.",
      href: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    },
    {
      key: "gdp" as const, label: "GDP per capita (current US$)", code: "NY.GDP.PCAP.CD",
      suffix: " US$", digits: 0, unit: "current US dollars per person",
      description: "GDP divided by population at current prices and exchange rates. This is not average salary, household income or a purchasing-power-adjusted figure.",
      href: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD",
    },
    {
      key: "unemployment" as const, label: "Unemployment rate (ILO modelled estimate)", code: "SL.UEM.TOTL.ZS",
      suffix: "%", digits: 1, unit: "percentage of the labour force",
      description: "People without work who are available for and seeking work. This ILO modelled series combines nationally reported observations with adjusted, imputed and projected values. The value returned here does not identify which status applies to this country-year; consult ILOSTAT's country-year metadata or the national statistical authority before interpreting it. Imputed values carry high uncertainty and should not be used to rank or compare countries.",
      href: "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS",
      methodology: "https://ilostat.ilo.org/resources/concepts-and-definitions/ilo-modelled-estimates/",
    },
    {
      key: "lifeExpectancy" as const, label: "Life expectancy at birth", code: "SP.DYN.LE00.IN",
      suffix: " years", digits: 1, unit: "years",
      description: "The number of years a newborn would live if current age-specific mortality rates applied throughout life. It is a population-level statistical estimate, not an individual prediction.",
      href: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN",
    },
  ];
  const missingCount = stats ? indicators.filter(item => !stats[item.key].data).length : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-primary/[0.07] via-card to-accent/[0.06] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold"><Globe2 className="h-4 w-4 text-primary" /> Country and economy profile</div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Retrieve selected country-directory details and the latest non-empty observation available for each indicator. The indicators can refer to different years and should not be read as one same-year snapshot. Values are reproduced from the named source; they are not independently audited by Amineva Global.</p>
          </div>
          <Badge variant="outline">World Bank Indicators API</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <label htmlFor="destination-country" className="mb-1.5 block text-xs font-medium text-muted-foreground">Select a country or economy</label>
            <select id="destination-country" value={countryCode} onChange={e => setCountryCode(e.target.value)} disabled={loadingCountries || countries.length === 0} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{loadingCountries ? "Loading country directory…" : countries.length ? "Choose a country or economy" : "Country directory unavailable"}</option>
              {countries.map(item => <option key={item.iso2Code} value={item.iso2Code}>{item.name}</option>)}
            </select>
            {countries.length > 0 && <p className="mt-1.5 text-[10px] text-muted-foreground">{countries.length.toLocaleString()} listed countries and economies · World Bank directory</p>}
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">Read this profile carefully.</strong> National averages hide differences between regions, cities and groups. This is a statistical starting point, not a complete assessment of living conditions, job prospects or travel eligibility.
          </div>
        </div>
      </div>

      {country && <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-xl font-semibold">{country.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {[
                country.capitalCity?.trim() ? "Capital: " + country.capitalCity.trim() : "",
                country.region?.value || "",
                country.incomeLevel?.value ? "World Bank income group: " + country.incomeLevel.value : "",
              ].filter(Boolean).join(" · ") || "Directory details not supplied"}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">Income group is the World Bank's annual classification, not a permanent country rating.</p>
          </div>
          <Badge variant="secondary">ISO {country.iso2Code}</Badge>
        </div>

        {loadingStats ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Retrieving each indicator independently…</div>
        ) : stats ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {indicators.map(item => {
                const result = stats[item.key];
                const observation = result.data;
                return (
                  <article key={item.key} className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <Badge variant={observation ? "outline" : "secondary"}>{observation ? "Observation found" : result.error?.startsWith("No non-empty observation") ? "No observation" : "Unavailable"}</Badge>
                    </div>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                      {observation ? formatNumber(observation.value, item.digits) + item.suffix : "Unavailable"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {observation?.date ? "Observation year: " + observation.date : result.error || "No non-empty observation returned."}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[10px]">
                      <span className="font-mono text-muted-foreground">{item.code}</span>
                      <a href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Indicator data and definition <ExternalLink className="h-3 w-3" /></a>
                      {item.methodology && <a href={item.methodology} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">ILO method <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                    {observation?.footnote && <p className="mt-2 rounded-md bg-muted/60 p-2 text-[10px] leading-4 text-muted-foreground">Source note: {observation.footnote}</p>}
                  </article>
                );
              })}
            </div>
            {missingCount > 0 && <p role="status" className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">{missingCount} indicator{missingCount === 1 ? "" : "s"} returned no usable value. Missing data is not zero and may reflect reporting coverage, source availability or a retrieval problem. Review the individual status above.</p>}
            {retrievedAt && <p className="mt-4 text-[11px] text-muted-foreground">Retrieved from the World Bank API: {new Date(retrievedAt).toLocaleString()} · This is the retrieval time, not the publication date. Each card shows its own observation year.</p>}
          </>
        ) : null}
      </div>}

      {error && <p role="status" className="mx-5 mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground md:mx-6">{error}</p>}

      <div className="border-t border-border bg-muted/20 p-5 md:p-6">
        <h3 className="font-semibold text-sm">Confirm visa and entry rules separately</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Entry requirements depend on the traveller's passport nationality, destination, travel purpose and date. IATA and foreign-ministry advice are useful references, but the destination government's immigration authority is the controlling source for its entry rules. Confirm directly before booking or travelling.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="https://www.iata.org/en/travel-centre/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">IATA Travel Centre <ExternalLink className="h-3.5 w-3.5" /></a>
          <a href="https://www.gov.uk/foreign-travel-advice" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">UK government travel advice <ExternalLink className="h-3.5 w-3.5" /></a>
          <a href="https://travel.state.gov/content/travel/en/international-travel.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">U.S. government travel advice <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3 text-[10px]">
          <a className="text-primary underline underline-offset-2" href="https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures" target="_blank" rel="noreferrer">World Bank API query rules</a>
          <a className="text-primary underline underline-offset-2" href="https://datahelpdesk.worldbank.org/knowledgebase/articles/1886695-metadata-api-queries" target="_blank" rel="noreferrer">World Bank metadata documentation</a>
          <a className="text-primary underline underline-offset-2" href="https://datahelpdesk.worldbank.org/knowledgebase/articles/898599-indicator-api-queries" target="_blank" rel="noreferrer">Indicator definitions and metadata</a>
        </div>
      </div>
    </section>
  );
}

function ClimateExplorer() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [rows, setRows] = useState<ClimateMonth[]>([]);
  const [period, setPeriod] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retrievedAt, setRetrievedAt] = useState("");
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    const lat = Number(latitude), lon = Number(longitude);
    if (latitude.trim() === "" || longitude.trim() === "" || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError("Enter a valid latitude (−90 to 90) and longitude (−180 to 180).");
      return;
    }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");
    setRows([]);
    setPeriod("");
    setSources([]);
    setRetrievedAt("");
    try {
      const result = await fetchClimateNormals(lat, lon, controller.signal);
      if (activeRequest.current !== controller) return;
      setRows(result.rows);
      setPeriod(result.period || "The API did not provide explicit start and end dates for this climatology response.");
      setSources(result.sources);
      setRetrievedAt(new Date().toISOString());
      if (!result.rows.length) setError("NASA POWER returned no usable monthly values for these coordinates. Missing grid-cell values are not displayed as zero.");
    } catch (err: any) {
      if (err?.name !== "AbortError" && activeRequest.current === controller) setError(err?.message || "The climate service could not be reached. Try again.");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-primary/[0.07] via-card to-accent/[0.06] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="flex items-center gap-2 text-sm font-semibold"><CloudSun className="h-4 w-4 text-primary" /> Point-based monthly climate averages</div><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Retrieve NASA POWER's predefined monthly climatology for one coordinate. These are long-term gridded averages, not current weather, a location-specific station observation, a forecast or a crop-suitability verdict.</p></div>
          <Badge variant="outline">NASA POWER · Agroclimatology</Badge>
        </div>
        <form onSubmit={run} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="climate-lat">Latitude</label><Input id="climate-lat" value={latitude} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLatitude(e.target.value)} placeholder="e.g. 5.6037" inputMode="decimal" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="climate-lon">Longitude</label><Input id="climate-lon" value={longitude} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLongitude(e.target.value)} placeholder="e.g. -0.1870" inputMode="decimal" /></div>
          <Button type="submit" disabled={loading} className="sm:mt-6">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Retrieve</Button>
        </form>
      </div>
      {error && <p role="status" className="m-5 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{error}</p>}
      {loading && <div className="flex items-center gap-2 p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Retrieving monthly averages…</div>}
      {rows.length > 0 && <>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5"><p className="text-xs text-muted-foreground">Requested coordinate: {latitude}, {longitude}</p><p className="text-[11px] text-muted-foreground">Retrieved {new Date(retrievedAt).toLocaleString()}</p></div>
        <div className="m-5 overflow-x-auto rounded-xl border border-border"><table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr><th className="px-3 py-2 font-medium">Month</th><th className="px-3 py-2 font-medium">Mean temp. °C</th><th className="px-3 py-2 font-medium">Precipitation mm/day</th><th className="px-3 py-2 font-medium">Relative humidity %</th></tr></thead><tbody>{rows.map(row => <tr key={row.month} className="border-t border-border"><td className="px-3 py-2 font-medium">{row.month}</td><td className="px-3 py-2 tabular-nums">{formatNumber(row.temperature, 1)}</td><td className="px-3 py-2 tabular-nums">{formatNumber(row.precipitation, 1)}</td><td className="px-3 py-2 tabular-nums">{formatNumber(row.humidity, 1)}</td></tr>)}</tbody></table></div>
        <div className="mx-5 mb-5 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold">Data context and limitations</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">NASA POWER climatology period: {period} The API's climatology service supplies a predefined climatology; this interface does not assume a 1991–2020 normal period. Coordinates are mapped to gridded data, so results may differ from a nearby weather station and should not be treated as field measurements.</p>
          {sources.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">Underlying data source identifier(s): {sources.join(", ")}</p>}
          <p className="mt-2 text-[11px] text-muted-foreground">Precipitation is a mean daily rate in mm/day, not the total rainfall for the month. Monthly totals require a separate calculation using the applicable daily-rate convention and should not be inferred from this table alone.</p>
        </div>
      </>}
      <div className="border-t border-border bg-muted/20 p-5">
        <p className="text-[11px] leading-5 text-muted-foreground">Source and method: <a href="https://power.larc.nasa.gov/docs/services/api/temporal/climatology/" target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2">NASA POWER Climatology API documentation</a> · <a href="https://power.larc.nasa.gov/docs/services/api/temporal/" target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2">Temporal API product descriptions</a>. Review parameter metadata, source model and grid limitations before operational decisions.</p>
      </div>
    </section>
  );
}

export default function InfoDiscoveryPage() {
  const { categorySlug, topicSlug } = useParams<{ categorySlug?: string; topicSlug?: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const heroIndex = 0;
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [savedTopicsList, setSavedTopicsList] = useState<SavedTopicItem[]>(() => getSavedTopics());
  const [recentTopicsList, setRecentTopicsList] = useState<RecentTopicItem[]>(() => getRecentTopics());
  const [countryList, setCountryList] = useState<{ iso2Code: string; name: string }[]>([]);
  const [mainGoal, setMainGoal] = useState("");
  const [numberToTrack, setNumberToTrack] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const topicArticleRef = useRef<HTMLElement | null>(null);

  const selected = categories.find(category => category.slug === categorySlug);
  const topics = selected ? allTopics(selected) : [];
  const selectedTopic = topicSlug ? topics.find(item => item.slug === topicSlug) : undefined;

  // Track recent topic view
  useEffect(() => {
    if (selected && selectedTopic) {
      recordRecentTopic({
        categorySlug: selected.slug,
        categoryTitle: selected.title,
        topicSlug: selectedTopic.slug,
        topicTitle: selectedTopic.title,
        kind: "topic",
      });
      setRecentTopicsList(getRecentTopics());
    }
  }, [selected, selectedTopic]);

  const filteredSections = useMemo(() => selected?.sections.map(section => ({ ...section, items: section.items.filter(item => (sectionFilter === "all" || section.title === sectionFilter) && normalise([item.title, item.description, ...item.questions].join(" ")).includes(normalise(topicFilter.trim()))) })).filter(section => section.items.length > 0) || [], [selected, sectionFilter, topicFilter]);
  const searchIndex = useMemo(() => categories.flatMap(category => [
    { kind: "area" as const, label: category.title, detail: category.summary, category, slug: category.slug },
    ...allTopics(category).map(item => ({
      kind: "topic" as const,
      label: item.title,
      detail: [item.section, item.description, item.questions.join(" "), category.slug === "business-management" ? BUSINESS_SEARCH_TERMS[item.slug] || "" : "", category.slug === "agriculture-climate-intelligence" ? AGRICULTURE_SEARCH_TERMS[item.slug] || "" : "", category.slug === "travel-destination" ? TRAVEL_SEARCH_TERMS[item.slug] || "" : "", category.slug === "operational-intelligence" ? OPERATIONAL_SEARCH_TERMS[item.slug] || "" : "", category.slug === "financial-operations" ? FINANCIAL_SEARCH_TERMS[item.slug] || "" : ""].join(" · "),
      category,
      slug: item.slug,
    })),
  ]), []);
  const searchResults = useMemo(() => {
    const clean = normalise(query.trim());
    if (!clean) return [];
    const terms = clean.split(/\s+/).filter(term => term.length > 1 && !SEARCH_STOP_WORDS.has(term));
    const lookupTerms = terms.length ? terms : [clean];
    return searchIndex
      .map(item => {
        const title = normalise(item.label);
        const searchable = normalise([item.label, item.detail, item.category.title].join(" "));
        const matchedTerms = lookupTerms.filter(term => searchable.includes(term)).length;
        const titleScore = title === clean ? 100 : title.startsWith(clean) ? 60 : title.includes(clean) ? 40 : 0;
        return { item, score: titleScore + matchedTerms * 10, matchedTerms };
      })
      .filter(result => result.matchedTerms === lookupTerms.length)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(result => result.item);
  }, [query, searchIndex]);

  const goToCategory = (slug: string) => { const category = categories.find(item => item.slug === slug); if (category) { recordRecentTopic({ categorySlug: category.slug, categoryTitle: category.title, topicSlug: "__area__", topicTitle: category.title, kind: "area" }); setRecentTopicsList(getRecentTopics()); } setQuery(""); setShowSuggestions(false); navigate("/info-discovery/" + slug); };
  const goToTopic = (catSlug: string, topSlug: string) => { setQuery(""); setShowSuggestions(false); navigate("/info-discovery/" + catSlug + "/" + topSlug); };
  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    recordRecentSearch(clean);
    setRecentTopicsList(getRecentTopics());
    setShowSuggestions(true);
    if (searchResults.length === 1) {
      const result = searchResults[0];
      if (result.kind === "area") goToCategory(result.category.slug);
      else goToTopic(result.category.slug, result.slug);
    }
  };
  const onSelectRecent = (item: RecentTopicItem) => {
    if (item.kind === "search") {
      setQuery(item.topicTitle);
      setShowSuggestions(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (item.kind === "area" || item.topicSlug === "__area__") {
      goToCategory(item.categorySlug);
    } else {
      goToTopic(item.categorySlug, item.topicSlug);
    }
  };
  const onClearRecent = () => {
    clearRecentTopics();
    setRecentTopicsList([]);
  };

  const isCurrentSaved = selected && selectedTopic ? isTopicSaved(selected.slug, selectedTopic.slug) : false;

  const toggleBookmarkCurrent = () => {
    if (!selected || !selectedTopic) return;
    if (isCurrentSaved) {
      const match = savedTopicsList.find(t => t.categorySlug === selected.slug && t.topicSlug === selectedTopic.slug);
      if (match) removeSavedTopic(match.id);
      toast.info("Topic removed from Saved Topics.");
    } else {
      saveTopicBookmark({
        categorySlug: selected.slug,
        categoryTitle: selected.title,
        topicSlug: selectedTopic.slug,
        topicTitle: selectedTopic.title,
        description: selectedTopic.description,
        questions: selectedTopic.questions,
        sources: selected.sources,
      });
      toast.success("Topic bookmarked and saved in Workspace!");
    }
    setSavedTopicsList(getSavedTopics());
  };

  const handleExportToWorkspace = async () => {
    if (!selected || !selectedTopic) return;
    try {
      const res = await sendTopicToWorkspace({
        title: selectedTopic.title,
        categoryTitle: selected.title,
        description: selectedTopic.description,
        questions: selectedTopic.questions,
        sources: selected.sources,
        mainGoal: mainGoal.trim() || undefined,
        numberToTrack: numberToTrack.trim() || undefined,
      });
      toast.success(`Saved to Workspace Docs: ${res.title}`);
      navigate(`/workspace/docs/${res.docId}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save topic in Workspace.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!topicArticleRef.current || !selectedTopic) return;
    setIsExportingPDF(true);
    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: 12,
        filename: `${selectedTopic.slug}-report.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };
      await html2pdf().set(opt).from(topicArticleRef.current).save();
      toast.success("PDF exported successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate PDF. You can also use Print.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (topicSlug && selected && !selectedTopic) {
    return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-2xl font-semibold">Topic not found</h1><p className="mt-2 text-muted-foreground">The requested topic is not part of this discovery area.</p><Button onClick={() => goToCategory(selected.slug)} className="mt-5">Back to {selected.title}</Button></main>;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative bg-primary px-5 pb-12 pt-8 text-primary-foreground md:px-8 md:pb-16 md:pt-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{ background: HERO_SCENES[0].bg }} />
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-primary-foreground/70">
            <Link to="/" className="transition hover:text-primary-foreground">Amineva Global</Link><ChevronRight className="h-3.5 w-3.5" /><Link to="/info-discovery" className="transition hover:text-primary-foreground">Info Discovery</Link>
            {selected && <><ChevronRight className="h-3.5 w-3.5" /><button onClick={() => goToCategory(selected.slug)} className="transition hover:text-primary-foreground">{selected.title}</button></>}
            {selectedTopic && <><ChevronRight className="h-3.5 w-3.5" /><span className="text-primary-foreground">{selectedTopic.title}</span></>}
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide"><Globe2 className="h-3.5 w-3.5 text-accent" /> {HERO_SCENES[heroIndex].label}</div>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{selectedTopic ? selectedTopic.title : selected ? selected.title : "Understand what matters. Know where to go next."}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/80 md:text-base">{selectedTopic ? selectedTopic.description : selected ? selected.summary : HERO_SCENES[heroIndex].line}</p>
          </div>
          <div className="relative z-40 mx-auto mt-7 max-w-3xl">
            <form onSubmit={onSearchSubmit} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 text-foreground shadow-xl sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3"><Search className="h-5 w-5 shrink-0 text-muted-foreground" /><Input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => window.setTimeout(() => setShowSuggestions(false), 160)} placeholder="Search topics and subject areas" className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" aria-label="Search information discovery" /></div>
              <Button type="submit" className="h-11 bg-accent px-6 text-accent-foreground hover:bg-accent/90" disabled={!query.trim()}>Search <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
            <p className="mt-2 text-center text-[11px] text-primary-foreground/70">Search results come from the subjects and guides published in Info Discovery.</p>
            {showSuggestions && query.trim() && <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-card p-2 text-left text-foreground shadow-2xl">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Matching areas and topics</p>
              {searchResults.length > 0 ? searchResults.map((result, index) => <button key={result.category.slug + result.slug + index} type="button" onMouseDown={e => e.preventDefault()} onClick={() => result.kind === "area" ? goToCategory(result.category.slug) : goToTopic(result.category.slug, result.slug)} className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-accent/5">
                <span className="mt-0.5 rounded-xl border border-accent/20 bg-accent/10 p-2 text-accent">{result.kind === "area" ? <result.category.icon className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold group-hover:text-primary">{result.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{result.category.title}{result.kind === "topic" ? " · " + result.detail.split(" · ")[0] : ""}</span></span><ChevronRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </button>) : <div className="px-3 py-5"><p className="text-sm font-semibold text-foreground">No matching topic found.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Try a different keyword or browse one of the discovery areas below.</p></div>}
            </div>}
            
          </div>
        </div>
      </section>


      {selected?.slug === "career-development-education" && (
        <section aria-label="Career development resources" className="mx-auto max-w-7xl px-5 pt-7 md:px-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Continue your journey</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Explore learning and impact opportunities</h2>
            </div>
            <span className="text-xs text-muted-foreground">Amineva Global</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <a
              href="https://as.amineva.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative isolate flex min-h-40 items-center gap-4 overflow-hidden rounded-2xl border border-accent/30 bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-accent/15 via-transparent to-primary/5 opacity-80 transition-opacity group-hover:opacity-100" />
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-105">
                <GraduationCap className="h-7 w-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Independent learning platform</span>
                <span className="block text-xl font-bold tracking-tight text-foreground">Adesua</span>
                <span className="mt-1.5 block max-w-xl text-sm leading-6 text-muted-foreground">Practical learning, career guidance, self-assessment and an examination portal, with video explainers showing how the platform works.</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore Adesua <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              </span>
            </a>
            <Link
              to="/impact"
              className="group relative isolate flex min-h-40 items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-70 transition-opacity group-hover:opacity-100" />
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                <Compass className="h-7 w-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Education and community initiatives</span>
                <span className="block text-xl font-bold tracking-tight text-foreground">Amineva Impact</span>
                <span className="mt-1.5 block max-w-xl text-sm leading-6 text-muted-foreground">Discover Amineva Global's educational and community initiatives, school engagements and programme updates.</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore Amineva Impact <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              </span>
            </Link>
          </div>
        </section>
      )}

      {!selectedTopic && selected?.slug === "business-management" && selected.product && (
        <InventraSpotlight product={selected.product} />
      )}

      {!selectedTopic && selected?.slug === "agriculture-climate-intelligence" && selected.product && (
        <AgroClimateSpotlight product={selected.product} />
      )}
      {!selectedTopic && selected?.slug === "it-innovation" && selected.product && (
        <DataLensSpotlight product={selected.product} />
      )}
      {selectedTopic && selected?.slug === "business-management" && selected.product && <InventraSpotlight product={selected.product} />}
      {selectedTopic && selected?.slug === "agriculture-climate-intelligence" && selected.product && <AgroClimateSpotlight product={selected.product} />}
      {selectedTopic && selected?.slug === "it-innovation" && selected.product && <DataLensSpotlight product={selected.product} />}
      {!selectedTopic && selected?.slug === "financial-operations" && selected.product && <SikasemSpotlight product={selected.product} />}
      {selectedTopic && selected?.slug === "financial-operations" && selected.product && <SikasemSpotlight product={selected.product} />}
      {selectedTopic && selected?.product && !["business-management","agriculture-climate-intelligence","it-innovation","financial-operations","career-development-education"].includes(selected.slug) && <ProductConnection product={selected.product} />}

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4" /> Browse areas</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSavedDrawerOpen(true)}
                className="h-8 gap-1.5 text-xs font-semibold"
                title="View Saved Topics in Workspace"
              >
                <Bookmark className="h-3.5 w-3.5 text-accent" />
                <span>Saved ({savedTopicsList.length})</span>
              </Button>
            </div>
            <nav className="space-y-1">
              <button onClick={() => navigate("/info-discovery")} className={"flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm " + (!selected ? "bg-accent/15 font-semibold text-foreground shadow-[inset_3px_0_0_hsl(var(--accent))]" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>All areas <span className="text-xs">{String(categories.length).padStart(2, "0")}</span></button>
              {categories.map(category => <button key={category.slug} onClick={() => goToCategory(category.slug)} className={"flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm " + (selected?.slug === category.slug ? "bg-accent/15 font-semibold text-foreground shadow-[inset_3px_0_0_hsl(var(--accent))]" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><category.icon className="h-4 w-4 shrink-0" /><span>{category.title}</span></button>)}
            </nav>
          </div>
          <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-accent" /> Evidence and source standards</div>
            <ul className="space-y-2 text-xs leading-5 text-muted-foreground">
              <li>Identify the original source and its authority.</li><li>Record the jurisdiction, publication date and last update.</li><li>Separate observations, estimates, forecasts and interpretations.</li><li>Show uncertainty and missing evidence rather than filling gaps.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Compass className="h-4 w-4 text-accent" /> How to use this system</div>
            <p className="text-xs leading-5 text-muted-foreground">Start with an area, narrow to a topic, then compare the evidence. Use the search field for a question or subject. Check who published each claim, what location and period it covers, and whether it is a confirmed fact, estimate or interpretation. Use official authorities for current rules and decisions.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-accent" /> Discovery corner</div>
            <p className="text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Research tip:</span> Turn a broad question into smaller questions. Identify the exact place, people, period and decision involved before comparing information.</p>
            <div className="my-3 border-t border-border" />
            <p className="text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Evidence check:</span> A recent result is not automatically reliable. Look for the original publisher, method, date and limitations before relying on it.</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-7">
          {selectedTopic && selected && <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => goToCategory(selected.slug)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to {selected.title}
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmarkCurrent}
                  className="h-8 text-xs font-medium gap-1.5"
                  title="Bookmark and keep in Workspace"
                >
                  {isCurrentSaved ? (
                    <>
                      <BookmarkCheck className="h-3.5 w-3.5 text-accent" /> Bookmarked
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-3.5 w-3.5" /> Bookmark
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToWorkspace}
                  className="h-8 text-xs font-medium gap-1.5"
                  title="Keep this topic in Workspace Docs"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-accent" /> Keep in Workspace
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 text-xs font-medium gap-1.5"
                  title="Print this shareable topic guide"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="h-8 text-xs font-medium gap-1.5"
                  title="Export shareable PDF for schools and organisations"
                >
                  {isExportingPDF ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Shareable PDF
                </Button>

                <Badge variant="secondary">{selectedTopic.section}</Badge>
              </div>
            </div>

            <article ref={topicArticleRef} className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-accent/[0.05] p-6 shadow-md md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Lightbulb className="h-4 w-4" /> What this topic helps you investigate
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  Amineva Global Research Topic
                </Badge>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                {selectedTopic.title}
              </h2>
              <p className="mt-1 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">
                {selectedTopic.description}
              </p>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground">Questions to answer</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {selectedTopic.questions.map(q => (
                    <div key={q} className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm leading-6">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      {q}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask about this topic alongside evidence checklist */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <AskTopicPanel
                  topicTitle={selectedTopic.title}
                  categoryTitle={selected.title}
                  description={selectedTopic.description}
                  questions={selectedTopic.questions}
                  referenceSources={selected.sources}
                />

                <div className="rounded-xl border border-border p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Info className="h-4 w-4 text-accent" /> Evidence checklist
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      For any figure or rule, capture the publisher, the exact page or dataset, the geography and population it covers, the observation or publication date, the method used, and any caveats. An indexed item is a lead for investigation - not automatic confirmation.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
                    Checkpoints: Original Publisher · Jurisdiction & Scope · Observation Year · Methodology Note
                  </div>
                </div>
              </div>

              {/* Project main goal & number to track for schools & organisations */}
              <ProjectGoalTracker
                mainGoal={mainGoal}
                onChangeMainGoal={setMainGoal}
                numberToTrack={numberToTrack}
                onChangeNumberToTrack={setNumberToTrack}
              />
            </article>

            <ResearchPanel initialQuery={selectedTopic.title} />
            {selected.slug === "travel-destination" && (
              <>
                <CountryExplorer onCountriesLoaded={setCountryList} />
                <VisaChecker countries={countryList} />
              </>
            )}
            {selected.slug === "agriculture-climate-intelligence" && <ClimateExplorer />}

            <p className="text-[11px] text-muted-foreground">
              This topic guide is an investigation structure. It does not itself certify a current visa rule, price, job vacancy, crop condition or organisational finding.
            </p>
          </section>}

          {selected && !selectedTopic && <section className="space-y-6">
            <div className={"rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8 " + (selected.slug === "business-management" ? "border-t-4 border-t-accent" : selected.slug === "agriculture-climate-intelligence" ? "border-r-4 border-r-success" : selected.slug === "operational-intelligence" ? "border-b-4 border-b-primary" : "border-l-4 border-l-accent")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary"><span className="rounded-xl border border-accent/25 bg-accent/10 p-2 text-accent"><selected.icon className="h-4 w-4" /></span>Area overview</div>
                <div className="flex flex-wrap gap-2"><Badge variant="outline">{allTopics(selected).length} topics</Badge><Badge variant="outline">{selected.sections.length} subject groups</Badge></div>
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">{selected.purpose}</p>
            </div>
            <div><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Subject menu</h2><p className="mt-1 text-sm text-muted-foreground">Search within this area or filter by subject group.</p></div><Badge variant="outline">{filteredSections.reduce((count, section) => count + section.items.length, 0)} matching topics</Badge></div>
              <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,240px)]"><Input value={topicFilter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopicFilter(e.target.value)} placeholder="Filter topics and questions" aria-label="Filter topics in this discovery area" /><select value={sectionFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSectionFilter(e.target.value)} aria-label="Filter by subject group" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All subject groups</option>{selected.sections.map(section => <option key={section.title} value={section.title}>{section.title}</option>)}</select></div>
              {filteredSections.length ? <div className="space-y-4">{filteredSections.map((section, sectionIndex) => {
                const edgeClasses = ["border-t-4 border-t-primary", "border-r-4 border-r-accent", "border-b-4 border-b-success/75", "border-l-4 border-l-primary/75"];
                const groupAccent = edgeClasses[sectionIndex % edgeClasses.length];
                return <section key={section.title} className={"rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md " + groupAccent}>
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{section.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{section.description}</p></div><Badge variant="outline">{section.items.length}</Badge></div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">{section.items.map((item, itemIndex) => {
                    const cardEdges = ["border-t-[3px] border-t-primary/80", "border-r-[3px] border-r-accent", "border-b-[3px] border-b-success/70", "border-l-[3px] border-l-primary/65"];
                    const cardAccent = cardEdges[(itemIndex + sectionIndex) % cardEdges.length];
                    return <button key={item.title} onClick={() => goToTopic(selected.slug, slugify(item.title))} className={"group relative flex min-h-36 flex-col rounded-xl border border-border bg-background/70 p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-card hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 " + cardAccent}>
                      <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{item.title}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></span>
                      <span className="mt-2 block flex-1 text-xs leading-5 text-muted-foreground">{item.description}</span>
                      <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-80 group-hover:opacity-100">Explore topic <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                    </button>;
                  })}</div>
                </section>;
              })}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No topics match these filters. Clear the search or select all subject groups.</div>}
            </div>
            {selected.slug === "travel-destination" && <CountryExplorer />}
            {selected.slug === "agriculture-climate-intelligence" && <ClimateExplorer />}
            <ResearchPanel initialQuery={selected.title} />

            {selected.slug === "operational-intelligence" && <div className="rounded-2xl border border-border bg-muted/40 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-accent" /> Authorised evidence only</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Verification and anomaly detection require approved connections to source systems, documented permissions and review controls. This public information area explains the method; it does not claim access to private organisational records.</p></div>}
          </section>}

          {!selected && <section className="space-y-7">
            {/* Popular Topics & Recently Viewed Quick-Start */}
            <PopularAndRecent
              recentTopics={recentTopicsList}
              onSelectTopic={(catSlug: string, topSlug: string) => goToTopic(catSlug, topSlug)}
              onSelectRecent={onSelectRecent}
              onClearRecent={onClearRecent}
            />

            <div><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Explore the seven areas</h2><p className="mt-1 text-sm text-muted-foreground">Start with a clear overview, explore the questions that matter and find the right service for the next step.</p></div><Badge variant="outline">7 areas</Badge></div>
              <div className="grid gap-4 md:grid-cols-2">{categories.map(category => <button key={category.slug} onClick={() => goToCategory(category.slug)} className="group flex h-full flex-col rounded-2xl border border-t-4 border-t-accent/70 border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-xl"><div className="mb-4 flex items-start justify-between"><span className="rounded-xl border border-primary/10 bg-primary/10 p-3 text-primary"><category.icon className="h-6 w-6" /></span><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary" /></div><h3 className="text-lg font-semibold">{category.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{category.summary}</p><div className="mt-4 flex flex-wrap gap-1.5">{category.sections.slice(0, 3).map(section => <span key={section.title} className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">{section.title}</span>)}</div><div className="mt-4 flex items-center border-t border-border pt-3 text-xs font-semibold text-primary">Open subject menu <ChevronRight className="ml-1 h-4 w-4" /></div></button>)}</div>
            </div>
            <ResearchPanel />
            <div className="rounded-2xl border border-border bg-card shadow-sm p-5"><div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div><h2 className="font-semibold">How information is classified</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Official records, statistical estimates, research publications, reported experiences and analytical interpretations are not interchangeable. Every important claim should be checked against its original publisher, date, jurisdiction, method and verification status.</p></div></div></div>
          </section>}
        </div>
      </div>

      {/* Slide-over drawer for Saved Topics in Workspace */}
      {savedDrawerOpen && (
        <SavedTopicsDrawer
          savedTopics={savedTopicsList}
          onRefresh={() => setSavedTopicsList(getSavedTopics())}
          onClose={() => setSavedDrawerOpen(false)}
        />
      )}
    </main>
  );
}



function DataLensSpotlight({ product }: { product: ProductLink }) {
  const capabilities = [
    { icon: Laptop, title: "Website and application services", description: "Plan, build, maintain and improve websites and digital applications.", edge: "border-t-4 border-t-primary" },
    { icon: Code, title: "Software development", description: "Develop tailored software, mobile applications and system integrations.", edge: "border-r-4 border-r-accent" },
    { icon: Server, title: "Cloud and infrastructure", description: "Configure hosting, servers, deployment, backups and service continuity.", edge: "border-b-4 border-b-success/75" },
    { icon: Wrench, title: "IT support and troubleshooting", description: "Resolve technical issues and support devices, accounts, networks and business email.", edge: "border-l-4 border-l-primary/70" },
    { icon: Database, title: "Database and data management", description: "Design, maintain, migrate, secure and optimise organisational data systems.", edge: "border-t-4 border-t-accent" },
    { icon: ShieldCheck, title: "Cybersecurity and protection", description: "Improve access controls, technical safeguards, updates and recovery readiness.", edge: "border-r-4 border-r-success/75" },
  ];
  return <section aria-label="Explore DataLens IT services" className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
    <div className="overflow-hidden rounded-3xl border border-accent/30 bg-card shadow-md">
      <div className="grid gap-6 border-t-4 border-t-accent p-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 md:p-8">
        <div className="flex flex-col items-start justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent"><Wrench className="h-3.5 w-3.5" /> Professional IT services</span>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">Practical technology services for dependable operations.</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">DataLens brings together professional IT services covering website and application maintenance, custom software development, cloud infrastructure and deployment, technical support, database management and system integration.</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Use these guides to understand your organisation's technology needs, ask better questions and plan the right level of technical support. Continue to DataLens to review the services and request assistance.</p>
          <a href={product.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">{product.label} <ArrowUpRight className="h-4 w-4" /></a>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Continue to DataLens for professional IT service information and enquiries.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">{capabilities.map(item => <article key={item.title} className={"rounded-2xl border border-border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md " + item.edge}><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary"><item.icon className="h-4 w-4" /></div><h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></article>)}</div>
      </div>
    </div>
  </section>;
}

function SikasemSpotlight({ product }: { product: ProductLink }) {
  const capabilities = [
    { icon: Store, title: "Mobile money and vendor operations", description: "Record activity across cash, mobile money and bank channels, with transaction references and vendor oversight.", edge: "border-t-4 border-t-primary" },
    { icon: Wallet, title: "Cash and digital float", description: "Track physical cash and electronic float movements so operators can understand available working balances.", edge: "border-r-4 border-r-accent" },
    { icon: Users, title: "Savings and field collections", description: "Support collector workflows for member deposits, customer records and daily collection summaries.", edge: "border-b-4 border-b-success/75" },
    { icon: FileCheck2, title: "Debt collection follow-up", description: "Record field-visit outcomes, amounts collected, repayment promises and follow-up information.", edge: "border-l-4 border-l-primary/70" },
    { icon: BarChart3, title: "Financial ledger and reconciliation", description: "Bring transaction, deposit, field-collection, float and forex activity into a shared financial view.", edge: "border-t-4 border-t-accent" },
    { icon: ShieldCheck, title: "Accountability and audit records", description: "Review staff and collector activity, transaction history, supporting evidence and operational exceptions.", edge: "border-r-4 border-r-success/75" },
    { icon: CreditCard, title: "Lending partner access", description: "Review available lending partners and retain references for applications continued through lender channels.", edge: "border-b-4 border-b-primary/70" },
    { icon: Landmark, title: "Forex and financial services", description: "Record foreign-exchange operations and support related financial-service workflows, including insurance records.", edge: "border-l-4 border-l-accent" },
  ];
  return <section aria-label="Explore Sikasɛm Financial Operations" className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
    <div className="overflow-hidden rounded-3xl border border-accent/30 bg-card shadow-md">
      <div className="grid gap-6 border-t-4 border-t-accent p-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 md:p-8">
        <div className="flex flex-col items-start justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent"><Wallet className="h-3.5 w-3.5" /> Financial operations</span>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">Keep financial network activity visible, traceable and accountable.</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Sikasɛm is designed for financial networks that need to monitor transactions and field operations across mobile money vendors, savings collectors, microfinance and microcredit operations, savings and loans organisations, rural banks and related service providers.</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">The application brings together vendor transactions, cash and digital float, collector deposits, debt-collection visits, financial ledger records, forex activity and operational oversight. The guides on this page also explain wider financial-management practices—such as income, expenses, budgeting and cash flow—so users can understand the full financial picture without assuming every practice is a separate Sikasɛm module.</p>
          <a href={product.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">{product.label} <ArrowUpRight className="h-4 w-4" /></a>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Open the Sikasɛm application to review its current workflows and platform access.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">{capabilities.map(item => <article key={item.title} className={"rounded-2xl border border-border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md " + item.edge}><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary"><item.icon className="h-4 w-4" /></div><h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></article>)}</div>
      </div>
    </div>
  </section>;
}

function AgroClimateSpotlight({ product }: { product: ProductLink }) {
  const capabilities = [
    { icon: CloudSun, title: "Weather and climate context", description: "Explore local weather information and seasonal conditions that influence farm planning.", accent: "border-l-primary" },
    { icon: Sprout, title: "Production risk awareness", description: "Consider crop, livestock and environmental risks alongside field observations.", accent: "border-l-success/75" },
    { icon: Compass, title: "Location and field context", description: "Relate farm locations and field conditions to the wider environment.", accent: "border-l-accent" },
    { icon: Package, title: "Farm input management", description: "Bring visibility to seeds, fertiliser, feed and other resources used in production.", accent: "border-l-primary" },
    { icon: BookOpen, title: "Agricultural learning", description: "Build understanding of farming practices, production decisions and responsible use of information.", accent: "border-l-success/75" },
    { icon: Warehouse, title: "Post-harvest and operations", description: "Think beyond the field to storage, handling, movement and delivery of produce.", accent: "border-l-accent" },
  ];

  return (
    <section aria-label="Explore AgroClimate" className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
      <div className="overflow-hidden rounded-3xl border border-success/25 bg-card shadow-md">
        <div className="grid gap-6 border-l-4 border-l-success p-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 md:p-7 lg:p-8">
          <div className="flex flex-col items-start justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-success">
              <Sprout className="h-3.5 w-3.5" /> Amineva agriculture platform
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
              Connect climate conditions with the decisions made on your farm.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Farming decisions are connected. Weather and seasonal conditions influence planting and field work; land, water and crop requirements influence what can grow; and input availability, labour, storage and transport affect what a farm can produce and deliver.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              AgroClimate brings agricultural and climate tools together to help users explore weather information, production risks, farm learning and input management. Use the information alongside field observations, local conditions and qualified agricultural advice when making important production decisions.
            </p>
            <a
              href={product.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-bold text-success-foreground shadow-sm transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
            >
              {product.label} <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Continue to AgroClimate to explore the available tools and platform workflows.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((item) => (
              <article key={item.title} className={"rounded-2xl border border-border border-l-4 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md " + item.accent}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 px-5 py-3 text-[11px] text-muted-foreground md:px-7">
          <span>For crop production · livestock · farm operations</span>
          <span>Weather · inputs · field context · farm planning</span>
        </div>
      </div>
    </section>
  );
}

function InventraSpotlight({ product }: { product: ProductLink }) {
  const capabilities = [
    { icon: Package, title: "Inventory visibility", description: "Monitor stock levels, low-stock alerts and reorder points.", accent: "border-l-primary" },
    { icon: ShoppingCart, title: "Point of sale", description: "Record sales with barcode scanning, receipts and multiple payment options.", accent: "border-l-accent" },
    { icon: BarChart3, title: "Sales performance", description: "Review daily sales summaries, revenue and product performance trends.", accent: "border-l-success/75" },
    { icon: Users, title: "Staff and accountability", description: "Use PIN-based staff access, role permissions and activity logs.", accent: "border-l-primary" },
    { icon: Warehouse, title: "Multiple locations", description: "Keep inventory visible across shops, warehouses and distribution points.", accent: "border-l-accent" },
    { icon: Store, title: "Different business types", description: "Designed for retail shops, wholesalers, warehouses, restaurants and bars.", accent: "border-l-success/75" },
  ];

  return (
    <section aria-label="Explore Inventra" className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
      <div className="overflow-hidden rounded-3xl border border-accent/35 bg-card shadow-md">
        <div className="grid gap-6 border-l-4 border-l-accent p-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 md:p-7 lg:p-8">
          <div className="flex flex-col items-start justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              <Package className="h-3.5 w-3.5" /> Amineva business platform
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
              Keep your stock, sales and store operations in view.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Inventra brings inventory tracking and point-of-sale sales into one business workflow. Set up products and categories, monitor quantities, record sales and review how products are performing—so everyday decisions are based on business records rather than guesswork.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Track low-stock items and reorder points, process barcode-assisted sales, issue receipts and review daily sales summaries. Staff can work with PIN-based access and role permissions, while activity logs support clearer accountability. For businesses with more than one shop or warehouse, multi-location inventory tools help keep stock activity connected.
            </p>
            <a
              href={product.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {product.label} <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Open Inventra to explore the platform and its registration options.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((item) => (
              <article key={item.title} className={"rounded-2xl border border-border border-l-4 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md " + item.accent}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 px-5 py-3 text-[11px] text-muted-foreground md:px-7">
          <span>For retailers · wholesalers · warehouses · restaurants · bars</span>
          <span>Designed for desktop, tablet and mobile use</span>
        </div>
      </div>
    </section>
  );
}

function ProductConnection({ product }: { product: ProductLink }) {
  return <div className="flex flex-col justify-between gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 to-transparent p-5 sm:flex-row sm:items-center"><div><div className="mb-1 text-sm font-semibold">Continue with {product.label.replace("Explore ", "")}</div><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{product.description}</p></div><a href={product.href} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center text-sm font-semibold text-primary hover:underline">{product.label} <ExternalLink className="ml-2 h-4 w-4" /></a></div>;
}
