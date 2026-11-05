import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Search, GraduationCap, Plane, Laptop, BriefcaseBusiness,
  Sprout, ShieldCheck, Globe2, SlidersHorizontal, ExternalLink,
  ChevronRight, BookOpen, CloudSun, Loader2, CheckCircle2, Compass,
  Package, ShoppingCart, BarChart3, Users, Warehouse, Store,
  AlertTriangle, Info, ArrowUpRight, Lightbulb, Bookmark, BookmarkCheck,
  Printer, Download, FolderPlus,
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
    summary: "Research countries and destinations through entry requirements, living conditions, employment, education, safety, law and social conditions.",
    purpose: "A destination is more than a visa rule or a tourist attraction. This area helps people examine the conditions that affect visiting, studying, working or living in another country. Entry rules depend on passport nationality, travel purpose and date; they must be confirmed with the responsible government authority before travel.",
    sections: [
      { title: "Country and destination profiles", description: "Build a structured picture of a country and its regions.", items: [
        topic("Country overview and regions", "Review geography, regions, capital, population context and broad economic indicators.", ["Which region or city is relevant?", "Are national averages representative of the destination city?", "What is the year and source of each indicator?"]),
        topic("Living conditions and public services", "Investigate housing, transport, utilities, healthcare, connectivity and access to services.", ["What are typical housing arrangements?", "How reliable and accessible are transport and utilities?", "Which services vary significantly by region?"]),
        topic("Cost of living and personal budgets", "Build a destination-specific budget using current local prices rather than a single national estimate.", ["What are current rents in the intended city?", "Which costs are recurring or seasonal?", "What currency, exchange rate date and household size are assumed?"]),
        topic("Culture, language and local norms", "Understand languages, everyday customs, social expectations and regional differences.", ["Which languages are used in daily life and public services?", "What cultural expectations affect work or study?", "Which customs or rules should visitors understand?"]),
      ]},
      { title: "Entry, immigration and travel", description: "Identify the official rules that apply to a particular passport and purpose.", items: [
        topic("Visa and entry requirements", "Check visa, transit, passport-validity, vaccination and supporting-document requirements for a defined nationality and purpose.", ["What passport will the traveller use?", "Is the purpose tourism, study, work, transit or residence?", "Which official authority published the rule and when was it checked?"]),
        topic("Official application process", "Find the responsible government or embassy, application steps, fees, appointment route and required evidence.", ["Which government department is responsible?", "Is the application submitted directly or through an authorised provider?", "Are fees and processing times published by the authority?"]),
        topic("Embassies and consular support", "Locate official diplomatic and consular services and understand their jurisdiction.", ["Which embassy or consulate covers the applicant's location?", "What services are provided and what requires an appointment?", "Are emergency contact details published on an official domain?"]),
        topic("Travel advisories and health requirements", "Compare official safety, health and regional risk notices, taking issue date and traveller nationality into account.", ["Who issued the advisory and for which citizens?", "Which regions and risks are covered?", "When was the advice last updated?"]),
      ]},
      { title: "Work, education and social conditions", description: "Assess whether a destination is suitable for longer-term plans.", items: [
        topic("Employment and unemployment", "Review labour-market conditions, demand by occupation, wages and work-authorisation requirements.", ["Are figures national or city-specific?", "Do they cover citizens, residents or foreign workers?", "Is a work permit required before employment begins?"]),
        topic("Education and study opportunities", "Compare institutions, qualifications, admissions, fees and international-student requirements.", ["Is the institution officially recognised?", "What are the admission and language requirements?", "What visa and work conditions apply to students?"]),
        topic("Discrimination, racism and inclusion", "Examine documented social conditions, legal protections and reported experiences without treating a country or population as uniform.", ["What protections exist in law?", "Which groups or settings are covered by the evidence?", "Are reports official statistics, surveys, journalism or personal accounts?"]),
        topic("Laws, rights and responsibilities", "Identify laws that materially affect visitors, students, workers and residents.", ["Which laws apply to the intended activity?", "Are there restrictions that differ from the traveller's home country?", "Which official legal or government source is authoritative?"]),
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
    slug: "it-innovation", title: "IT and Innovation", icon: Laptop,
    summary: "Understand digital systems, infrastructure, cybersecurity, databases, cloud services, automation and professional IT support.",
    purpose: "Technology should solve an operational need and remain dependable after launch. This area helps individuals and organisations understand what systems they need, the risks of neglect, the trade-offs between cloud and self-hosted infrastructure, and the maintenance required to keep technology useful and secure.",
    sections: [
      { title: "Digital products and system development", description: "Plan, build, improve and maintain working digital services.", items: [
        topic("Website and web application development", "Understand the work involved in planning, building, testing, deploying and supporting websites and web applications.", ["What user problem must the system solve?", "Which workflows and integrations are required?", "Who will maintain it after launch?"]),
        topic("Software maintenance and reliability", "Review updates, bug fixes, compatibility, performance, backups and operational support.", ["Who monitors failures and responds?", "How are changes tested before release?", "Can the service be restored after a failure?"]),
        topic("System integration and APIs", "Connect independent systems through controlled interfaces and well-defined data contracts.", ["Which system owns each record?", "How are authentication, permissions and errors handled?", "How are duplicate events and failed syncs reconciled?"]),
      ]},
      { title: "Data and infrastructure", description: "Choose infrastructure based on workload, risk, capacity and operating capability.", items: [
        topic("Cloud versus self-hosted infrastructure", "Compare managed cloud services with infrastructure operated directly by an organisation.", ["Who patches and monitors the servers?", "What are the full costs of compute, storage, bandwidth and backups?", "What happens if the provider or local operator is unavailable?"]),
        topic("Database design and management", "Understand data modelling, access patterns, query performance, backup and retention.", ["Which data must be stored and for how long?", "Are indexes aligned with actual queries?", "Can redundant records or oversized payloads be eliminated safely?"]),
        topic("Cloud services and deployment", "Investigate hosting, storage, networking, identity, observability and deployment pipelines.", ["What is included in the service plan?", "Where are data and backups stored?", "Are usage limits, egress and maintenance costs understood?"]),
      ]},
      { title: "Security and organisational IT", description: "Reduce exposure and support reliable day-to-day technology operations.", items: [
        topic("Cybersecurity and access control", "Assess identity, authentication, permissions, patching, backups, incident response and user awareness.", ["Who has access and why?", "Are privileged actions logged and reviewed?", "Can compromised access be revoked quickly?"]),
        topic("Business automation", "Identify repetitive, error-prone processes suitable for controlled automation.", ["What triggers the workflow?", "What approval or exception path is needed?", "How will the system prove that the action completed?"]),
        topic("IT infrastructure management", "Review devices, networks, domains, email, servers, licences and technical support.", ["Which assets exist and who owns them?", "What dependencies can interrupt operations?", "Which maintenance tasks are overdue?"]),
        topic("Professional IT services and talent", "Identify the expertise required for implementation, support, security and ongoing operations.", ["Is the task project-based or continuous?", "What measurable service level is needed?", "How will technical quality and handover be assessed?"]),
      ]},
    ],
    sources: [
      { name: "NIST Cybersecurity Framework 2.0", scope: "Cybersecurity risk governance and management outcomes", type: "Official standards guidance", url: "https://www.nist.gov/cyberframework" },
      { name: "OWASP Top 10", scope: "Common critical web application security risk categories", type: "Open security reference", url: "https://owasp.org/projects/top-ten" },
      { name: "CISA", scope: "Cybersecurity, secure-by-design and infrastructure protection guidance", type: "Official U.S. cyber defence agency", url: "https://www.cisa.gov/" },
      { name: "World Bank Open Data", scope: "Country-level digital development and economic indicators where available", type: "Official international statistics", url: "https://data.worldbank.org/" },
    ],
    product: { label: "Explore DataLens", href: "https://app.amineva.com", description: "Continue to DataLens for deeper business and data intelligence services." },
  },
  {
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
    slug: "agriculture-climate-intelligence", title: "Agriculture and Climate Intelligence", icon: Sprout,
    summary: "Connect weather, climate risks, land and crop suitability, satellite observations, farm operations, logistics and market conditions.",
    purpose: "Agricultural decisions depend on local conditions and changing evidence. Useful intelligence connects climate and weather observations with crop requirements, land characteristics, satellite signals, farm activity, logistics and market information. A climate indicator is not, by itself, a field inspection or a crop-yield prediction.",
    sections: [
      { title: "Climate and environmental conditions", description: "Investigate weather and longer-term environmental patterns relevant to agricultural decisions.", items: [
        topic("Weather observations and forecasts", "Separate observed weather from forecast values and climate averages.", ["What is the observation period?", "Which weather station, grid or model produced the value?", "How far ahead is the forecast and how uncertain is it?"]),
        topic("Seasonal climate risks", "Review rainfall, temperature, drought, heat and other seasonal risks relevant to a crop and location.", ["Which season and growing stage are affected?", "Is the source a forecast, historical analysis or observation?", "What local evidence is available?"]),
        topic("Rainfall and temperature patterns", "Explore the timing, distribution and variability of rainfall and temperature.", ["What is the monthly pattern?", "How does the selected period compare with the long-term baseline?", "Are extreme events hidden by averages?"]),
      ]},
      { title: "Land, crop and satellite intelligence", description: "Assess land characteristics and investigate observed changes.", items: [
        topic("Land suitability", "Examine soil, slope, drainage, water access, climate and land-use constraints before selecting a site.", ["What soil and terrain evidence exists?", "Is water available through the growing season?", "What restrictions or competing land uses apply?"]),
        topic("Crop-specific suitability", "Compare crop requirements with the climate, soil, water and management conditions of a proposed site.", ["What temperature and rainfall range does the crop require?", "What soil and growing-period constraints matter?", "What local trial or extension evidence is available?"]),
        topic("Satellite mapping and crop stress", "Use satellite observations as indicators for investigation, not as automatic proof of crop condition.", ["Which sensor and acquisition date were used?", "What cloud, resolution or seasonal limitations apply?", "Can the anomaly be checked in the field?"]),
      ]},
      { title: "Farm operations, logistics and markets", description: "Connect production decisions with the wider agricultural system.", items: [
        topic("Farm management and field records", "Organise farm activities, input use, planting, field observations and operational history.", ["Are farm boundaries and field IDs consistent?", "Are inputs, labour and activities dated?", "Can observations be linked to a field and crop cycle?"]),
        topic("Agricultural logistics and post-harvest", "Examine storage, handling, transport, loss and delivery requirements.", ["What are the expected harvest volumes and timing?", "What storage and temperature conditions are required?", "Where can handling or transport create losses?"]),
        topic("Market and food-price intelligence", "Compare market information by commodity, location, market level and observation date.", ["Is the value a farm-gate, wholesale or retail price?", "What market and unit does it describe?", "How old is the observation?"]),
      ]},
    ],
    sources: [
      { name: "FAO GIEWS Data and Tools", scope: "Food security, agricultural monitoring and food-price information", type: "Official UN food and agriculture source", url: "https://www.fao.org/giews/data-tools/en/" },
      { name: "NASA POWER", scope: "Meteorological and solar datasets with point and regional temporal services", type: "Public Earth-science data service", url: "https://power.larc.nasa.gov/" },
      { name: "Copernicus Data Space", scope: "Sentinel and other Earth-observation datasets, browser and APIs", type: "Official Earth-observation data access", url: "https://dataspace.copernicus.eu/explore-data" },
    ],
    product: { label: "Explore AgroClimate", href: "https://agro.amineva.com/create-account", description: "Continue into agricultural and climate intelligence tools." },
  },
  {
    slug: "operational-intelligence", title: "Operational Intelligence", icon: ShieldCheck,
    summary: "Establish what is happening across an organisation by connecting processes, records, evidence, exceptions and outcomes.",
    purpose: "Organisations often hold fragmented records across people, documents and separate systems. Operational Truth Infrastructure is a way to establish what is known, what conflicts, what remains unverified, what needs attention and whether agreed actions produced the intended result. It depends on authorised access to relevant evidence; no automated summary can replace original records, accountable review and independent verification.",
    sections: [
      { title: "Operational Truth Infrastructure", description: "Five connected capabilities for examining the reality of organisational activity.", items: [
        topic("Reality Mapping", "Create a structured picture of processes, systems, records, activities, responsibilities, dependencies and relationships.", ["Which process is being examined?", "Which people, systems and records participate?", "Where are the hand-offs, dependencies and control points?"]),
        topic("Cross-System Verification", "Compare authorised records across systems to identify contradictions, missing information and discrepancies.", ["Which source system owns each field?", "Do record identifiers, dates, quantities and status agree?", "Could timing, duplicate events or incomplete synchronisation explain the difference?"]),
        topic("Evidence Intelligence", "Examine documents, transactions, communications and records while retaining their origin and context.", ["Who created the evidence and when?", "Does it directly support the claim?", "Is it original, copied, incomplete, disputed or unverified?"]),
        topic("Continuous Anomaly Detection", "Identify unusual patterns and changes in connected, authorised operational data.", ["What is the normal baseline?", "What changed, when and in which system?", "Is the alert a confirmed incident, a risk signal or an item requiring review?"]),
        topic("Outcome Verification", "Check whether instructions, decisions, transactions, projects and corrective actions were completed and achieved their intended result.", ["What outcome was expected?", "What evidence proves completion?", "Did the result meet the intended standard and is follow-up required?"]),
      ]},
      { title: "Practical verification workflows", description: "Use evidence-led reviews to move from a reported issue to a defensible finding.", items: [
        topic("Record reconciliation", "Compare records using common identifiers, defined tolerances and a documented review period.", ["What is the comparison key?", "Which differences are material?", "Who reviews and resolves exceptions?"]),
        topic("Responsibility and approval trails", "Trace decisions, approvals, delegation, handovers and accountability.", ["Was the approver authorised at that time?", "Is the approval linked to the actual transaction?", "Can later changes be traced?"]),
        topic("Corrective-action tracking", "Follow a finding through assignment, due date, evidence of completion and outcome review.", ["Who owns the action?", "What evidence closes it?", "Who independently confirms that the risk was addressed?"]),
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
  "management-reports-and-business-decisions": "management dashboard business reporting monthly report variance analysis budget versus actual decision support"
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
      detail: [item.section, item.description, item.questions.join(" "), category.slug === "business-management" ? BUSINESS_SEARCH_TERMS[item.slug] || "" : ""].join(" · "),
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

      {selected?.slug === "business-management" && selected.product && (
        <InventraSpotlight product={selected.product} />
      )}

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
              <button onClick={() => navigate("/info-discovery")} className={"flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm " + (!selected ? "bg-accent/15 font-semibold text-foreground shadow-[inset_3px_0_0_hsl(var(--accent))]" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>All areas <span className="text-xs">06</span></button>
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
            {selected.product && selected.slug !== "career-development-education" && selected.slug !== "business-management" && <ProductConnection product={selected.product} />}
            <p className="text-[11px] text-muted-foreground">
              This topic guide is an investigation structure. It does not itself certify a current visa rule, price, job vacancy, crop condition or organisational finding.
            </p>
          </section>}

          {selected && !selectedTopic && <section className="space-y-6">
            {selected.slug === "business-management" ? (
              <div className="rounded-3xl border border-border border-l-4 border-l-accent bg-card p-6 shadow-sm md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span className="rounded-xl border border-accent/30 bg-accent/10 p-2 text-accent"><selected.icon className="h-4 w-4" /></span>
                    Area overview
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{allTopics(selected).length} topics</Badge>
                    <Badge variant="outline">{selected.sections.length} subject groups</Badge>
                  </div>
                </div>
                <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">{selected.purpose}</p>
              </div>
            ) : (
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-primary/90 p-6 text-primary-foreground shadow-lg shadow-primary/10 md:p-8"><div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-sm font-semibold text-accent"><selected.icon className="h-4 w-4" /> Area overview</div><p className="mt-3 max-w-4xl text-sm leading-7 text-primary-foreground/80 md:text-base">{selected.purpose}</p><div className="mt-5 flex flex-wrap gap-2"><Badge variant="outline" className="border-primary-foreground/25 text-primary-foreground">{allTopics(selected).length} topics</Badge><Badge variant="outline" className="border-primary-foreground/25 text-primary-foreground">{selected.sections.length} subject groups</Badge></div></div></div>
            )}
            <div><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Subject menu</h2><p className="mt-1 text-sm text-muted-foreground">Search within this area or filter by subject group.</p></div><Badge variant="outline">{filteredSections.reduce((count, section) => count + section.items.length, 0)} matching topics</Badge></div>
              <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,240px)]"><Input value={topicFilter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopicFilter(e.target.value)} placeholder="Filter topics and questions" aria-label="Filter topics in this discovery area" /><select value={sectionFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSectionFilter(e.target.value)} aria-label="Filter by subject group" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All subject groups</option>{selected.sections.map(section => <option key={section.title} value={section.title}>{section.title}</option>)}</select></div>
              {filteredSections.length ? <div className="space-y-4">{filteredSections.map((section, sectionIndex) => <section key={section.title} className={"rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md " + (selected.slug === "business-management" ? "border-l-4 " + (sectionIndex % 3 === 0 ? "border-l-primary" : sectionIndex % 3 === 1 ? "border-l-accent" : "border-l-success/75") : "")}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{section.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{section.description}</p></div><Badge variant="outline">{section.items.length}</Badge></div><div className="mt-4 grid gap-3 md:grid-cols-2">{section.items.map((item, itemIndex) => <button key={item.title} onClick={() => goToTopic(selected.slug, slugify(item.title))} className={"group relative flex min-h-36 flex-col rounded-xl border border-border bg-background/70 p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-card hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 " + (selected.slug === "business-management" ? "border-l-[3px] " + (itemIndex % 3 === 0 ? "border-l-primary/75" : itemIndex % 3 === 1 ? "border-l-accent" : "border-l-success/65") : "hover:border-accent/50 hover:bg-accent/5")}><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{item.title}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></span><span className="mt-2 block flex-1 text-xs leading-5 text-muted-foreground">{item.description}</span><span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-80 group-hover:opacity-100">Explore topic <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span></button>)}</div></section>)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No topics match these filters. Clear the search or select all subject groups.</div>}
            </div>
            {selected.slug === "travel-destination" && <CountryExplorer />}
            {selected.slug === "agriculture-climate-intelligence" && <ClimateExplorer />}
            <ResearchPanel initialQuery={selected.title} />
            {selected.product && selected.slug !== "career-development-education" && selected.slug !== "business-management" && <ProductConnection product={selected.product} />}
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

            <div><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Explore the six areas</h2><p className="mt-1 text-sm text-muted-foreground">Start with a clear overview, explore the questions that matter and find the right service for the next step.</p></div><Badge variant="outline">6 areas</Badge></div>
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
