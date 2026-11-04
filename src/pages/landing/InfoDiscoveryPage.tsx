import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Search, GraduationCap, Plane, Laptop, BriefcaseBusiness,
  Sprout, ShieldCheck, Globe2, SlidersHorizontal, ExternalLink, FileCheck2,
  ChevronRight, BookOpen, CloudSun, Loader2, CheckCircle2, Compass,
  AlertTriangle, Info, ArrowUpRight, Lightbulb,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    product: { label: "Explore Adesua", href: "https://as.amineva.com/get-started", description: "Continue into practical learning, guided exercises and skill development." },
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
    product: { label: "Explore DataLens", href: "https://app.amineva.com/signup", description: "Connect a relevant technology or infrastructure requirement with IT services." },
  },
  {
    slug: "business-management", title: "Business Management", icon: BriefcaseBusiness,
    summary: "Understand inventory, transactions, employee accountability, cash reconciliation, business controls and operational efficiency.",
    purpose: "A business needs to know what it owns, what moved, what was sold, what was paid, who authorised an action and what remains unresolved. This area focuses on practical controls and reliable operating records that help owners find discrepancies and make better decisions.",
    sections: [
      { title: "Inventory and stock control", description: "Account for stock from receipt through movement, sale, return and loss.", items: [
        topic("Inventory and stock records", "Track what is held, where it is held, who is responsible and how quantities change.", ["Does every stock movement have a dated record?", "Can stock be traced by location or batch?", "Who confirms receiving and dispatch?"]),
        topic("Stocktaking and discrepancies", "Compare recorded stock with physical counts and investigate variances.", ["What is the expected quantity?", "What was physically counted?", "Were timing, damaged goods, returns and unrecorded movements considered?"]),
        topic("Loss, damage and shrinkage", "Separate documented losses from unexplained differences and identify recurring causes.", ["Is the loss supported by an incident or adjustment record?", "Where and when does shrinkage occur?", "What controls could prevent recurrence?"]),
      ]},
      { title: "Sales, cash and transactions", description: "Connect the activity that creates revenue with payment and cash records.", items: [
        topic("Sales and transaction records", "Review completeness and consistency across sales, receipts, refunds and adjustments.", ["Can every sale be traced to a receipt or transaction ID?", "Are voids and refunds approved?", "Do sales channels reconcile to the same reporting period?"]),
        topic("Cash and payment reconciliation", "Compare expected receipts with bank, mobile-money, cash and payment-provider records.", ["What amount should have been received?", "What amount was actually received?", "Are fees, reversals, timing differences and cash expenses documented?"]),
        topic("Returns, adjustments and approvals", "Maintain an auditable explanation for stock or financial changes.", ["Who requested and approved the adjustment?", "Is there supporting evidence?", "Can the original record still be reconstructed?"]),
      ]},
      { title: "People, responsibility and performance", description: "Make roles, approvals and operational outcomes visible.", items: [
        topic("Employee accountability", "Connect responsibilities with authorised activities, handovers and documented outcomes.", ["Who was responsible for the task or asset?", "What evidence confirms the handover?", "Are permissions appropriate to the person's role?"]),
        topic("Internal controls and loss prevention", "Design checks that reduce error, misuse, fraud and unauthorised changes.", ["Are critical duties separated where practical?", "Which actions require approval?", "Are exceptions reviewed by someone independent?"]),
        topic("Operational efficiency and management reporting", "Use dependable records to identify bottlenecks, recurring exceptions and opportunities for improvement.", ["Which measure reflects the actual objective?", "How often is the information updated?", "Can a manager trace a reported figure to source records?"]),
      ]},
    ],
    sources: [
      { name: "IFRS for SMEs", scope: "Financial reporting requirements designed for eligible small and medium-sized entities", type: "Official international accounting standard", url: "https://www.ifrs.org/issued-standards/ifrs-for-smes/" },
      { name: "ACFE / COSO Fraud Risk Management", scope: "Fraud governance, risk assessment, control activities, investigation and monitoring", type: "Professional control guidance", url: "https://www.acfe.com/fraud-resources/fraud-risk-tools---coso/fraud-risk-management-guide" },
      { name: "OECD Data Explorer", scope: "Comparable economic and business-related indicators across participating economies", type: "International statistical source", url: "https://data-explorer.oecd.org/" },
    ],
    product: { label: "Explore Inventra", href: "https://stock.amineva.com/", description: "Move from understanding operational controls to managing inventory and business activity." },
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
    purpose: "Organisations often hold fragmented records across people, documents and separate systems. Operational Truth Infrastructure is a way to establish what is known, what conflicts, what remains unverified, what needs attention and whether agreed actions produced the intended result. It depends on authorised access to relevant evidence; it does not infer truth from an AI answer alone.",
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

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function normalise(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
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
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a subject, question or research topic" aria-label="Search research publications" />
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

function CountryExplorer() {
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
        if (active) setCountries(list);
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
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="climate-lat">Latitude</label><Input id="climate-lat" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g. 5.6037" inputMode="decimal" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="climate-lon">Longitude</label><Input id="climate-lon" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g. -0.1870" inputMode="decimal" /></div>
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

function SourceDirectory({ sources }: { sources: Source[] }) {
  return <section className="rounded-2xl border border-border bg-card shadow-sm p-5 md:p-6">
    <div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold"><FileCheck2 className="h-4 w-4 text-accent" /> Source directory</div><p className="mt-1 text-xs text-muted-foreground">Start with the source that has authority over the question.</p></div><Badge variant="outline">{sources.length} sources</Badge></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {sources.map(source => <article key={source.name} className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold">{source.name}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{source.scope}</p>
        <div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] text-muted-foreground">{source.type}</span><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Open source <ExternalLink className="h-3 w-3" /></a></div>
      </article>)}
    </div>
    <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
      <p className="text-xs font-semibold text-foreground">How to use this directory</p>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">These are starting points, not a claim that every linked page or dataset has been checked for the current question. Match the source to the claim: use the responsible government authority for current law and entry rules; the originating statistical agency for official national statistics; and the named research publisher or repository for a publication. Confirm the exact jurisdiction, population, reference period, definition, methodology and revision date before relying on a figure. A source's institutional authority does not make every third-party interpretation of its data authoritative.</p>
    </div>
  </section>;
}

export default function InfoDiscoveryPage() {
  const { categorySlug, topicSlug } = useParams<{ categorySlug?: string; topicSlug?: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const selected = categories.find(category => category.slug === categorySlug);
  const topics = selected ? allTopics(selected) : [];
  const selectedTopic = topicSlug ? topics.find(item => item.slug === topicSlug) : undefined;
  const filteredSections = useMemo(() => selected?.sections.map(section => ({ ...section, items: section.items.filter(item => (sectionFilter === "all" || section.title === sectionFilter) && normalise([item.title, item.description, ...item.questions].join(" ")).includes(normalise(topicFilter.trim()))) })).filter(section => section.items.length > 0) || [], [selected, sectionFilter, topicFilter]);
  const searchIndex = useMemo(() => categories.flatMap(category => [
    { kind: "area" as const, label: category.title, detail: category.summary, category, slug: category.slug },
    ...allTopics(category).map(item => ({ kind: "topic" as const, label: item.title, detail: item.section + " · " + item.description, category, slug: item.slug })),
  ]), []);
  const searchResults = useMemo(() => {
    const clean = normalise(query.trim());
    if (!clean) return [];
    return searchIndex.filter(item => normalise([item.label, item.detail, item.category.title].join(" ")).includes(clean)).slice(0, 12);
  }, [query, searchIndex]);

  const goToCategory = (slug: string) => { setQuery(""); setShowSuggestions(false); navigate("/info-discovery/" + slug); };
  const goToTopic = (catSlug: string, topSlug: string) => { setQuery(""); setShowSuggestions(false); navigate("/info-discovery/" + catSlug + "/" + topSlug); };
  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchResults.length) return;
    const first = searchResults[0];
    if (first.kind === "area") goToCategory(first.category.slug);
    else goToTopic(first.category.slug, first.slug);
  };

  if (topicSlug && selected && !selectedTopic) {
    return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-2xl font-semibold">Topic not found</h1><p className="mt-2 text-muted-foreground">The requested topic is not part of this discovery area.</p><Button onClick={() => goToCategory(selected.slug)} className="mt-5">Back to {selected.title}</Button></main>;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/85 px-5 py-10 text-primary-foreground md:px-8 md:py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium text-primary-foreground/70">
            <Link to="/" className="transition hover:text-primary-foreground">Amineva Global</Link><ChevronRight className="h-3.5 w-3.5" /><Link to="/info-discovery" className="transition hover:text-primary-foreground">Info Discovery</Link>
            {selected && <><ChevronRight className="h-3.5 w-3.5" /><button onClick={() => goToCategory(selected.slug)} className="transition hover:text-primary-foreground">{selected.title}</button></>}
            {selectedTopic && <><ChevronRight className="h-3.5 w-3.5" /><span className="text-primary-foreground">{selectedTopic.title}</span></>}
          </div>
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary-foreground"><Globe2 className="h-3.5 w-3.5 text-accent" /> INFORMATION DISCOVERY SYSTEM</div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-foreground md:text-5xl">{selectedTopic ? selectedTopic.title : selected ? selected.title : "Discover information. Understand your options. Make informed decisions."}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-primary-foreground/80 md:text-base">{selectedTopic ? selectedTopic.description : selected ? selected.summary : "Search across career development, destinations, technology, business, agriculture and operational intelligence. Move from a broad question to a structured subject, then follow the evidence and sources relevant to your decision."}</p>
          </div>
          <div className="relative mt-7 max-w-4xl">
            <form onSubmit={onSearchSubmit} className="flex flex-col gap-2 rounded-2xl border border-border bg-card shadow-sm p-2 text-foreground shadow-xl sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3"><Search className="h-5 w-5 shrink-0 text-muted-foreground" /><Input value={query} onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => window.setTimeout(() => setShowSuggestions(false), 160)} placeholder="Search areas, topics, questions and subjects" className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" aria-label="Search information discovery" /></div>
              <Button type="submit" className="h-11 bg-accent px-6 text-accent-foreground hover:bg-accent/90" disabled={!searchResults.length}>Open result <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
            {showSuggestions && query.trim() && <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-card p-2 text-foreground shadow-xl">
              {searchResults.length ? searchResults.map((result, index) => <button key={result.category.slug + result.slug + index} type="button" onMouseDown={e => e.preventDefault()} onClick={() => result.kind === "area" ? goToCategory(result.category.slug) : goToTopic(result.category.slug, result.slug)} className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-muted">
                <span className="mt-0.5 rounded-lg bg-accent/15 p-2 text-accent">{result.kind === "area" ? <result.category.icon className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{result.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{result.category.title}{result.kind === "topic" ? " · " + result.detail.split(" · ")[0] : ""}</span></span><ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
              </button>) : <p className="px-3 py-5 text-center text-sm text-muted-foreground">No matching area or topic. Try another phrase.</p>}
            </div>}
            <p className="mt-2 text-[11px] text-muted-foreground">Search opens a matching area or topic. Use the research index below to search indexed publications.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4" /> Browse discovery areas</div>
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
            <p className="text-xs leading-5 text-muted-foreground">Start with an area, narrow to a topic, compare evidence and follow the source links. Research metadata and public indicators are attributed to their providers and keep their own update dates.</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-7">
          {selectedTopic && selected && <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" size="sm" onClick={() => goToCategory(selected.slug)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to {selected.title}</Button><Badge variant="secondary">{selectedTopic.section}</Badge></div>
            <article className="rounded-2xl border border-border bg-card shadow-sm p-5 md:p-7">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent"><Lightbulb className="h-4 w-4" /> What this topic helps you investigate</div>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">{selectedTopic.description}</p>
              <div className="mt-6"><h2 className="text-sm font-semibold">Questions to answer</h2><div className="mt-3 grid gap-2 md:grid-cols-2">{selectedTopic.questions.map(q => <div key={q} className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm leading-6"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />{q}</div>)}</div></div>
              <div className="mt-6 rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-xs font-semibold"><Info className="h-4 w-4 text-accent" /> Evidence checklist</div><p className="mt-2 text-xs leading-5 text-muted-foreground">For any figure or rule, capture the publisher, the exact page or dataset, the geography and population it covers, the observation or publication date, the method used, and any caveats. An indexed item is a lead for investigation—not automatic confirmation.</p></div>
            </article>
            <ResearchPanel initialQuery={selectedTopic.title} />
            <SourceDirectory sources={selected.sources} />
            {selected.slug === "travel-destination" && <CountryExplorer />}
            {selected.slug === "agriculture-climate-intelligence" && <ClimateExplorer />}
            {selected.product && <ProductConnection product={selected.product} />}
            {selected.slug === "career-development-education" && <div className="rounded-2xl border border-border bg-card shadow-sm p-5"><h2 className="font-semibold">Amineva Impact</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">The existing school and community initiative material remains part of Career Development and Education.</p><Link to="/impact" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">View Amineva Impact engagements <ArrowUpRight className="h-4 w-4" /></Link></div>}
            <p className="text-[11px] text-muted-foreground">This topic guide is an investigation structure. It does not itself certify a current visa rule, price, job vacancy, crop condition or organisational finding.</p>
          </section>}

          {selected && !selectedTopic && <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm p-5 md:p-7"><div className="flex items-center gap-2 text-sm font-semibold text-accent"><selected.icon className="h-4 w-4" /> Area overview</div><p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">{selected.purpose}</p><div className="mt-5 flex flex-wrap gap-2"><Badge variant="outline">{allTopics(selected).length} topics</Badge><Badge variant="outline">{selected.sections.length} subject groups</Badge><Badge variant="outline">{selected.sources.length} reference sources</Badge></div></div>
            <div><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Subject menu</h2><p className="mt-1 text-sm text-muted-foreground">Search within this area or filter by subject group.</p></div><Badge variant="outline">{filteredSections.reduce((count, section) => count + section.items.length, 0)} matching topics</Badge></div>
              <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,240px)]"><Input value={topicFilter} onChange={e => setTopicFilter(e.target.value)} placeholder="Filter topics and questions" aria-label="Filter topics in this discovery area" /><select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} aria-label="Filter by subject group" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All subject groups</option>{selected.sections.map(section => <option key={section.title} value={section.title}>{section.title}</option>)}</select></div>
              {filteredSections.length ? <div className="space-y-4">{filteredSections.map(section => <section key={section.title} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{section.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{section.description}</p></div><Badge variant="outline">{section.items.length}</Badge></div><div className="mt-4 grid gap-2 md:grid-cols-2">{section.items.map(item => <button key={item.title} onClick={() => goToTopic(selected.slug, slugify(item.title))} className="group rounded-xl border border-border bg-card p-4 text-left transition hover:border-accent/50 hover:bg-accent/5"><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{item.title}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{item.description}</span></button>)}</div></section>)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No topics match these filters. Clear the search or select all subject groups.</div>}
            </div>
            {selected.slug === "travel-destination" && <CountryExplorer />}
            {selected.slug === "agriculture-climate-intelligence" && <ClimateExplorer />}
            <ResearchPanel initialQuery={selected.title} />
            <SourceDirectory sources={selected.sources} />
            {selected.product && <ProductConnection product={selected.product} />}
            {selected.slug === "career-development-education" && <div className="rounded-2xl border border-border bg-card shadow-sm p-5"><h2 className="font-semibold">Amineva Impact</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">School engagements and learner activities sit within this area rather than appearing as a separate discovery category.</p><Link to="/impact" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Explore existing engagements <ArrowUpRight className="h-4 w-4" /></Link></div>}
            {selected.slug === "operational-intelligence" && <div className="rounded-2xl border border-border bg-muted/40 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-accent" /> Authorised evidence only</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Verification and anomaly detection require approved connections to source systems, documented permissions and review controls. This public information area explains the method; it does not claim access to private organisational records.</p></div>}
          </section>}

          {!selected && <section className="space-y-7">
            <div><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Explore the six areas</h2><p className="mt-1 text-sm text-muted-foreground">Each area has its own subject menu, reference sources and discovery workflow.</p></div><Badge variant="outline">6 areas</Badge></div>
              <div className="grid gap-4 md:grid-cols-2">{categories.map(category => <button key={category.slug} onClick={() => goToCategory(category.slug)} className="group flex h-full flex-col rounded-2xl border border-t-4 border-t-accent/70 border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-xl"><div className="mb-4 flex items-start justify-between"><span className="rounded-xl border border-primary/10 bg-primary/10 p-3 text-primary"><category.icon className="h-6 w-6" /></span><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary" /></div><h3 className="text-lg font-semibold">{category.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{category.summary}</p><div className="mt-4 flex flex-wrap gap-1.5">{category.sections.slice(0, 3).map(section => <span key={section.title} className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">{section.title}</span>)}</div><div className="mt-4 flex items-center border-t border-border pt-3 text-xs font-semibold text-primary">Open subject menu <ChevronRight className="ml-1 h-4 w-4" /></div></button>)}</div>
            </div>
            <ResearchPanel />
            <div className="rounded-2xl border border-border bg-card shadow-sm p-5"><div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div><h2 className="font-semibold">How information is classified</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Official records, statistical estimates, research publications, reported experiences and AI-generated interpretations are not interchangeable. Each displayed result should retain its source, update date, jurisdiction, method and verification status. The live connectors currently available here are identified on their individual panels.</p></div></div></div>
          </section>}
        </div>
      </div>
    </main>
  );
}

function ProductConnection({ product }: { product: ProductLink }) {
  return <div className="flex flex-col justify-between gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 to-transparent p-5 sm:flex-row sm:items-center"><div><div className="mb-1 text-sm font-semibold">Continue with {product.label.replace("Explore ", "")}</div><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{product.description}</p></div><a href={product.href} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center text-sm font-semibold text-primary hover:underline">{product.label} <ExternalLink className="ml-2 h-4 w-4" /></a></div>;
}
