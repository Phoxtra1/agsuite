// Production build verification checkpoint.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Search, GraduationCap, Plane, BriefcaseBusiness, Sprout, ShieldCheck, Globe2, SlidersHorizontal, ExternalLink, ChevronRight, BookOpen, CloudSun, Loader2, CheckCircle2, Compass, ArrowUpRight, AlertTriangle, Info, Lightbulb, Bookmark, BookmarkCheck, Printer, Download, FolderPlus, FileCheck2, FileText, Wallet, Store, Users, BarChart3, CreditCard, Landmark, Package, ShoppingCart, Warehouse } from "lucide-react";
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
import { searchResearchRepositories, type ResearchRecord } from "@/lib/infoDiscovery/researchSearch";
import { searchDateIncidents, type DateIncidentRecord } from "@/lib/infoDiscovery/askTopic";
import { searchVerifiedDiscoveryRecords, getVerifiedDiscoveryDocumentUrl } from "@/lib/infoDiscovery/discoveryLibrary";
import { InvestigationsArchive } from "@/components/infoDiscovery/InvestigationsArchive";
import { BusinessCaseReference } from "@/components/infoDiscovery/BusinessCaseReference";

type CultureProfile = { community: string; history: string; wayOfLife: string; traditions: string; music: string };
type FestivalProfile = { origin: string; meaning: string; celebration: string; location: string };
type KingdomProfile = { country: string; period: string; overview: string; legacy: string; context?: string };
type TouristSiteProfile = { country: string; location: string; siteType: string; overview: string; history: string; significance: string; locationDetail: string; visitorExperience: string };
type Topic = { title: string; description: string; questions: string[]; culture?: CultureProfile; festival?: FestivalProfile; kingdom?: KingdomProfile; touristSite?: TouristSiteProfile };
type Section = { title: string; description: string; items: Topic[] };

const WikimediaProfileImage = ({ title, country, kind }: { title: string; country: string; kind: "kingdom" | "tourist site" }) => {
  const [image, setImage] = useState<{ url: string; filePage: string; credit: string; license: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setImage(null);
    setFailed(false);
    const search = `${title} ${country} ${kind}`;
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: search,
      gsrnamespace: "6",
      gsrlimit: "8",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "1400",
      format: "json",
      origin: "*",
    });

    fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Image search failed");
        return response.json();
      })
      .then((data) => {
        const pages = Object.values(data?.query?.pages || {}) as Array<{ title?: string; imageinfo?: Array<{ thumburl?: string; url?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }> }>;
        const candidates = pages
          .map((page) => {
            const info = page.imageinfo?.[0];
            return info?.thumburl && info.descriptionurl
              ? {
                  url: info.thumburl,
                  filePage: info.descriptionurl,
                  credit: (info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || "").replace(/<[^>]*>/g, "").trim(),
                  license: (info.extmetadata?.LicenseShortName?.value || "").replace(/<[^>]*>/g, "").trim(),
                  fileTitle: page.title || "",
                }
              : null;
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
        if (!candidates.length) throw new Error("No image found");
        const keywords = title.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
        candidates.sort((a, b) => {
          const score = (value: typeof a) => keywords.reduce((total, word) => total + (value.fileTitle.toLowerCase().includes(word) ? 1 : 0), 0);
          return score(b) - score(a);
        });
        setImage(candidates[0]);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setFailed(true);
      });

    return () => controller.abort();
  }, [title, country, kind]);

  if (!image) {
    return (
      <div className="mt-6 flex min-h-40 items-center justify-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground" aria-live="polite">
        {failed ? "A representative image is not available right now." : "Loading image…"}
      </div>
    );
  }

  return (
    <figure className="mt-6 overflow-hidden rounded-xl border border-border bg-background">
      <a href={image.filePage} target="_blank" rel="noreferrer" className="block">
        <img src={image.url} alt={`${title}, ${country}`} loading="lazy" className="max-h-[360px] w-full object-cover" />
      </a>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-xs text-muted-foreground">
        <span>Image: Wikimedia Commons{image.credit ? ` · ${image.credit}` : ""}{image.license ? ` · ${image.license}` : ""}</span>
        <a href={image.filePage} target="_blank" rel="noreferrer" className="underline underline-offset-2">Image details and licence</a>
      </figcaption>
    </figure>
  );
};

type Source = { name: string; scope: string; type: string; url: string };
type ProductLink = { label: string; href: string; introduction: string };
type Category = {
  slug: string; title: string; summary: string; purpose: string; icon: React.ElementType;
  sections: Section[]; sources: Source[]; product?: ProductLink;
};

const KINGDOM_PROFILE_CONTEXT: Record<string, string> = {
  "Ancient Egyptian Kingdoms": "The Old Kingdom is especially associated with pyramid-building; the Middle Kingdom with renewed royal administration and literature; and the New Kingdom with imperial expansion into Nubia and the Levant. These were distinct periods separated by political transitions, not one unchanging state. The Nile flood cycle, taxation, temples, specialised crafts and scribal administration underpinned royal power.",
  "Kingdom of Kush": "Kush shifted its political centre between Napata and Meroë and maintained its own dynasties, language and religious traditions. Kushite rulers conquered Egypt and founded its Twenty-Fifth Dynasty before Assyrian pressure pushed their power south. Meroë later became a centre of ironworking, craft production and Nile trade.",
  "Kingdom of Numidia": "Earlier Massylii and Masaesyli polities preceded the kingdom's consolidation under rulers such as Masinissa after the Second Punic War. Numidian cavalry and agricultural wealth gave the monarchy influence in Mediterranean diplomacy. Roman intervention and dynastic struggles eventually brought the kingdom under Roman control.",
  "Kingdom of Mauretania": "Under Juba II, Mauretania became a wealthy Roman client kingdom with a court that supported scholarship, coinage, commerce and monumental building. It was annexed by Rome in 40 CE after the execution of Ptolemy. This ancient kingdom occupied parts of modern Morocco and Algeria, not the modern state of Mauritania.",
  "Garamantian Kingdom": "The Garamantes developed fortified oasis settlements and used underground water channels, often called foggaras, to support agriculture in the Fezzan. Their position connected Mediterranean North Africa with routes across the Sahara. Archaeology reveals towns, irrigation systems, cemeteries and evidence of long-distance exchange.",
  "Kingdom of D'mt": "D'mt is known from inscriptions and archaeological remains in the northern Ethiopian and Eritrean highlands. Its communities had connections across the Red Sea, including with South Arabia, although the extent and nature of those relationships remain debated. D'mt is significant evidence of early state formation in the Horn before Aksum.",
  "Kingdom of Aksum": "Aksum's port of Adulis linked the highland kingdom with Arabia, the Mediterranean and the Indian Ocean. It issued coins, used Ge'ez inscriptions and erected monumental stelae. Christianity became associated with the royal court in the fourth century, shaping institutions that influenced later Ethiopian and Eritrean religious history.",
  "Ethiopian Kingdom (Solomonic Monarchy)": "Royal authority varied considerably across the dynasty's long history, depending on provincial nobles, military alliances, religious institutions and changing capitals. The monarchy experienced periods of centralisation and regional autonomy, survived the Italian occupation of 1936–1941, and ended in 1974. Its chronicles and manuscripts remain important historical sources.",
  "Kingdom of Asante": "Asante grew from an alliance of Akan states into a centralised kingdom under Osei Tutu I. The Golden Stool, associated in Asante tradition with Okomfo Anokye, symbolises the collective soul of Asanteman. Gold, agriculture, trade, military organisation and diplomacy supported the kingdom's power.",
  "Kingdom of Benin": "The Oba governed through palace chiefs, titled societies and provincial authorities. Benin City became a major urban and craft centre, renowned for its earthworks and guild-based bronze and brass casting. British forces attacked and looted the city in 1897, removing thousands of court objects; the Oba institution continues today.",
  "Kingdom of Dahomey": "Dahomey built a structured monarchy around Abomey, with royal offices, provincial authorities and military institutions. It participated in regional commerce and the Atlantic economy, including the trade in enslaved people. The kingdom fought France before becoming a French colony in 1894; the Royal Palaces of Abomey preserve key material evidence.",
  "Oyo Kingdom": "Oyo's government balanced the authority of the Alaafin with the Oyo Mesi council, Ogboni institutions and provincial leaders. Cavalry, northern trade networks and political alliances supported its expansion. Internal conflicts, provincial independence and regional wars weakened the kingdom during the nineteenth century.",
  "Kingdom of Ife": "Ile-Ife was both a sacred and political centre, with specialist craft communities and extensive regional connections. Its terracotta and copper-alloy sculptures demonstrate exceptional technical and artistic skill. Ife remains central to Yoruba accounts of origins and kingship and is still an active religious and cultural centre.",
  "Jolof Kingdom": "Jolof was a regional confederation whose ruler exercised changing degrees of authority over constituent Wolof states. The defeat of central Jolof authority at the battle of Danki in the sixteenth century accelerated the independence of Cayor, Baol and other states. Its history helps explain the Senegambian political landscape before colonial rule.",
  "Mossi Kingdoms": "Ouagadougou, Tenkodogo and Yatenga were distinct Mossi kingdoms rather than a single continuously centralised state. Their rulers used cavalry, agriculture, diplomacy and regional trade to preserve substantial autonomy. French conquest in the 1890s changed their political status, while the Mogho Naba institution remains influential.",
  "Kingdom of Kanem": "Kanem's rulers governed a state around Lake Chad and the caravan routes linking the central Sahara with the savanna. Its political fortunes were shaped by trade, agriculture, pastoralism, Islamic scholarship and relations with neighbouring communities. After upheaval, the ruling tradition shifted west and continued in Bornu.",
  "Kingdom of Kongo": "Mbanza Kongo was the royal capital, supported by provincial authorities and a sophisticated system of court and local government. Portuguese contact began in the late fifteenth century, bringing diplomacy, Christianity and literacy as well as growing involvement in the Atlantic slave trade. The 1665 battle of Mbwila was a major turning point.",
  "Kingdom of Ndongo": "Ndongo was ruled by an ngola, a title that contributed to the name Angola. Portuguese expansion and slave trading put pressure on the kingdom's political and commercial networks. Queen Njinga used diplomacy, military alliances and strategic leadership to resist Portuguese domination and also ruled neighbouring Matamba.",
  "Luba Kingdom": "Luba government combined sacred kingship, councils, court offices and networks of subordinate chiefs. Oral historians preserved royal genealogies and political memory, while the lukasa board helped trained custodians organise historical knowledge. Luba institutions influenced neighbouring states before nineteenth-century conflict and external trade altered the region.",
  "Lunda Kingdom": "The Lunda court was associated with the title Mwata Yamvo and governed through a network of related ruling houses and local authorities. Copper, salt, ivory, agriculture and regional trade supported its influence. Lunda-related political formations, including Cazembe, spread across parts of present-day Angola, the DRC and Zambia.",
  "Kuba Kingdom": "The Kuba kingdom brought several communities together under a central court led by the Nyim, supported by councils and titled officials. Its political system included rules for succession, dispute resolution and relations between the royal centre and constituent groups. Artists produced raffia textiles, carved objects, masks and royal regalia for both ceremonial and everyday use.",
  "Kingdom of Loango": "Loango was a Vili-led coastal kingdom north of Kongo. Its rulers connected inland producers with Atlantic merchants through trading settlements and networks that moved copper, ivory, textiles and other goods. Its history demonstrates the political importance of the central African coast and its relationships with inland powers.",
  "Kingdom of Buganda": "Buganda's monarchy relied on clan institutions, chiefs and a developed administrative system. Its position on Lake Victoria enabled trade and political links across the Great Lakes region. Britain established a protectorate over Uganda; the Buganda monarchy was abolished in 1967 and restored as a cultural institution in 1993.",
  "Bunyoro-Kitara Kingdom": "Kitara is preserved in regional historical traditions, but accounts of an earlier unified empire are partly oral and should be treated cautiously. The later Bunyoro kingdom developed around the Omukama and a court of chiefs. Salt, iron, agriculture and regional trade supported its power and rivalry with Buganda.",
  "Kingdom of Rwanda": "The monarchy expanded through royal authority, provincial chiefs, military service, cattle and agricultural systems. German and later Belgian colonial administrations transformed political institutions and hardened some social classifications. The monarchy was abolished in 1961; its history must be distinguished from colonial racial policies and later political narratives.",
  "Kingdom of Burundi": "The Ganwa dynasty ruled through a court, regional princes and local chiefs whose authority changed over time. German and Belgian colonial rule altered the relationship between the royal court and other institutions. Burundi became independent in 1962 and the monarchy was abolished in 1966; royal drum traditions remain important cultural heritage.",
  "Kingdom of Ankole": "Ankole, also called Nkore, was ruled by an Omugabe and included pastoral and farming communities. Long-horned cattle were important to elite identity and wealth, while agriculture and local exchange sustained wider society. The monarchy was abolished in Uganda's 1967 reorganisation, but cattle heritage and oral history remain significant.",
  "Kingdom of Kaffa": "Kaffa's royal court governed a forested highland region with fertile farmland, dense settlements and trade links. Tribute and relationships with local authorities supported the kingdom. Emperor Menelik II's forces conquered Kaffa in 1897, incorporating it into the Ethiopian empire and ending its independent monarchy.",
  "Kingdom of Mapungubwe": "Mapungubwe stood near the meeting of the Limpopo and Shashe rivers. Settlement patterns and imported goods point to a stratified society with a royal elite, supported by farming, cattle, gold working and exchange. The kingdom connected the southern African interior with wider Indian Ocean trading networks.",
  "Kingdom of Great Zimbabwe": "The monumental dry-stone walls were constructed by skilled African builders over generations without mortar. The royal centre was supported by farming and cattle-keeping communities, specialist production and gold trade. Connections with Swahili coastal markets linked the plateau to the wider Indian Ocean world.",
  "Kingdom of Mutapa": "Mutapa emerged in the northern Zimbabwe plateau and expanded toward the Zambezi and central Mozambique. Rulers claimed authority through dynastic and spiritual legitimacy, while provincial leaders and tributary communities supplied resources. Gold, ivory and agricultural products connected the kingdom to coastal trade.",
  "Rozvi Kingdom": "The Rozvi state is associated with the Changamire ruling house and the consolidation of power in the Zimbabwe plateau after Mutapa's decline. Its authority rested on military organisation, tribute, cattle and trade routes. Nineteenth-century regional upheaval and Ndebele expansion contributed to its decline.",
  "Maravi Kingdom": "Maravi was a network of related political communities around Lake Malawi and the Shire region, not a permanently centralised state. Rulers and lineages connected communities through kinship, tribute, trade and ritual institutions. Its history is linked to Chewa and neighbouring peoples and later contact with Portuguese and Swahili traders.",
  "Zulu Kingdom": "Shaka strengthened a centralised Zulu state in the early nineteenth century through military organisation, diplomacy and incorporation of neighbouring communities. The kingdom developed during wider regional upheaval whose causes are debated by historians. The Anglo-Zulu War of 1879 reshaped the monarchy but did not erase Zulu political and cultural identity.",
  "Ndebele Kingdom": "Mzilikazi led Ndebele communities north from the present-day South African interior and established a kingdom in southwest Zimbabwe. The state organised military regiments, royal settlements and tribute relationships. Under Lobengula, it faced British imperial expansion; the wars of the 1890s ended its independence.",
  "Basotho Kingdom": "Moshoeshoe I consolidated the Basotho nation during early nineteenth-century upheaval through diplomacy, alliance, refuge and defence. Thaba Bosiu became a strategic political centre. Conflicts with Boer settlers and negotiations with Britain shaped the kingdom's boundaries before Lesotho became independent in 1966.",
  "Kingdom of Eswatini (Swazi Kingdom)": "The Dlamini dynasty consolidated authority during the eighteenth and nineteenth centuries under rulers including Sobhuza I and Mswati II. The kingdom negotiated with neighbouring African states and European powers, became a British protectorate and gained independence in 1968. The monarchy remains a central cultural and constitutional institution.",
  "Lozi Kingdom (Barotseland)": "The Lozi kingdom developed around the upper Zambezi floodplain, where seasonal floods shaped agriculture, fishing, settlement and political life. The Litunga's authority was supported by chiefs and local governance. Kuomboka symbolises the movement from floodplain to higher ground and expresses the community's environmental knowledge.",
  "Merina Kingdom": "Andrianampoinimerina consolidated Imerina, and Radama I expanded Merina power across much of Madagascar while pursuing diplomatic, military and educational relationships with Britain. French conquest in 1895 and abolition of the monarchy in 1897 ended Merina sovereignty but not its influence on Malagasy statehood.",
  "Sakalava Kingdoms": "Menabe and Boina were major Sakalava kingdoms in western and northwestern Madagascar. Their rulers built authority through royal ancestry, alliances, control of trade routes and coastal commerce. Royal tombs and sacred relics remain important to Sakalava custodians and communities.",
  "Ghana Empire (Wagadu)": "Arabic-language accounts describe a royal court, taxation of trade and a political centre connected to Soninke communities. Gold from southern regions and salt from Saharan sources moved through commercial networks, while agriculture and livestock sustained settlements. Wagadu was not located in the modern Republic of Ghana.",
  "Mali Empire": "Sundiata Keita is associated with the empire's foundation in the thirteenth century. Mansas governed through provincial authorities and alliances, while gold, salt, copper and other goods moved between forest, savanna and Sahara. Mansa Musa's pilgrimage of 1324–1325 made the empire widely known beyond West Africa.",
  "Songhai Empire": "Sonni Ali expanded Songhai along the Niger River corridor and took control of major commercial centres. Askia Muhammad later strengthened provincial administration and Islamic scholarship. A Moroccan army defeated Songhai forces at Tondibi in 1591, transforming the western Sahel but not ending Songhai cultural traditions.",
  "Kanem-Bornu Empire": "The Sefuwa dynasty ruled for long periods, and the political centre shifted west from Kanem into Bornu after fourteenth-century upheaval. Mai Idris Alooma is remembered for military and administrative reforms. Bornu survived as a major state long after many medieval empires had disappeared.",
  "Kingdom of Takrur": "Takrur grew along the Senegal River, where farming, river transport and trans-Saharan trade supported political authority. It interacted with Soninke and Berber communities and became known in Arabic sources as an early Muslim state south of the Sahara. Its chronology and boundaries remain imperfectly documented.",
  "Kaabu Kingdom": "Kaabu emerged from the western reach of the Mali imperial political world and developed into a Mandinka-led state with its own ruling hierarchy. Its rulers maintained links with Mandinka communities, regional markets and Atlantic coastal trade. Its defeat at Kansala in 1867 is remembered as the end of its independence.",
  "Bono Kingdom": "Bono Manso and other centres were associated with early Akan state formation and long-distance gold trade. Royal lineages, chiefs and settlements organised authority across the forest-savanna transition. Bono history predates several better-known Akan states and helps explain the political and economic foundations on which they developed.",
  "Akwamu Kingdom": "Akwamu expanded from the forest interior toward trade routes and coastal settlements, using military strength, alliances and diplomacy. Its influence reached parts of the Accra plains and the Volta corridor. Defeat by Akyem forces in the eighteenth century led to a major political relocation across the Volta.",
  "Denkyira Kingdom": "Denkyira built authority over gold-producing districts and trade routes in the central forest zone. It was a major Akan power before Asante's rise. The Asante alliance defeated Denkyira at Feyiase in 1701, a turning point in the emergence of Asanteman; Denkyira survived as a traditional state.",
  "Kingdom of Dagbon": "Dagbon's political history is preserved through oral traditions, dynastic accounts and the institution of the Yaa Naa. Yendi became an important royal centre, while divisional chiefs governed communities across northern Ghana. Relations with Mamprugu, Gonja and regional trading networks shaped its history.",
  "Kingdom of Mamprugu": "Mamprugu is associated with the Mamprusi people and the Nayiri, whose seat is at Nalerigu. Its royal traditions connect to wider Mole-Dagbani histories, including narratives about Naa Gbewaa. Relationships with Dagbon, Nanumba, Gonja and neighbouring communities shaped its political influence.",
  "Almoravid Empire": "The Almoravids emerged among Sanhaja Amazigh communities in the western Sahara. Under Yusuf ibn Tashfin they founded Marrakesh and expanded through the Maghreb and across the Strait of Gibraltar into al-Andalus. Their empire connected Saharan routes with North African and Iberian cities.",
  "Almohad Caliphate": "Inspired by Ibn Tumart and expanded under Abd al-Mu'min, the Almohad movement replaced Almoravid rule across much of the western Islamic world. Its rulers built a centralised caliphal state and sponsored major architecture in Marrakesh, Rabat and Seville. Regional dynasties later broke away.",
  "Fatimid Caliphate": "The Fatimids established an Ismaili Shi'a caliphate in Ifriqiya before conquering Egypt in 969 and founding Cairo. Their state developed administrative, religious and commercial institutions. Cairo's al-Azhar began as a Fatimid mosque and teaching institution; Saladin ended the caliphate in 1171.",
  "Marinid Sultanate": "The Zenata Amazigh Marinid dynasty rose as Almohad power declined and ruled from centres including Fez. Its rulers supported madrasas, mosques and public buildings that remain among Morocco's important medieval monuments. Succession conflicts and political fragmentation weakened the sultanate in the fifteenth century.",
  "Hafsid Sultanate": "The Hafsids emerged from Almohad provincial administration and established an independent state in Ifriqiya. Tunis benefited from its position between Mediterranean routes and inland networks. Hafsid rulers maintained diplomacy, commerce and scholarship until Ottoman expansion culminated in the conquest of Tunis in 1574.",
  "Mamluk Sultanate of Egypt": "Mamluk military elites established a durable sultanate based in Cairo. They defeated Mongol forces at Ain Jalut in 1260 and fought Crusader states, while controlling key routes between the Mediterranean and Red Sea. Their rulers sponsored mosques, schools, hospitals and commercial buildings before Ottoman conquest in 1517.",
  "Zagwe Dynasty": "The Zagwe rulers governed a Christian highland kingdom from the Lasta region. The dynasty's chronology and transition to the Solomonic line are not fully settled. King Lalibela is traditionally associated with the rock-hewn churches that remain active sites of worship and a UNESCO World Heritage property.",
  "Sultanate of Ifat": "Ifat's rulers governed Muslim communities and trade routes in the eastern Ethiopian highlands and nearby lowlands. The sultanate interacted with Christian Ethiopian monarchs through diplomacy, commerce and military conflict. It is an important part of the Horn's history of religiously diverse states before Adal's rise.",
  "Adal Sultanate": "Adal became a major Muslim sultanate with links to Red Sea and Gulf of Aden trade. In the sixteenth century Ahmad ibn Ibrahim al-Ghazi led campaigns against the Ethiopian Christian kingdom, drawing in outside powers and reshaping the Horn's political balance. Its political centre shifted over time.",
  "Kilwa Sultanate": "Kilwa's harbour connected East African producers with merchants from Arabia, Persia, India and beyond. Gold from the southern interior, ivory and other goods supported the city-state's prosperity. Stone mosques, palaces and urban remains at Kilwa Kisiwani reveal the scale of Swahili coastal life.",
  "Ajuran Sultanate": "The Ajuran state developed around the Shabelle and Jubba river systems and parts of the southern Somali coast. It is associated with large wells, irrigation works, taxation and control of water in a semi-arid environment. Its political chronology is reconstructed from varied oral and historical sources.",
  "Funj Sultanate of Sennar": "The Funj state emerged around Sennar and the Blue Nile in the early sixteenth century. Its rulers governed through a royal court, provincial authorities and alliances with Arab groups and Muslim scholars. Sennar became a centre of Islamic learning before conquest by Ottoman-Egyptian forces in 1821.",
  "Sultanate of Darfur": "The Fur sultanate maintained a court and provincial authorities linked to trade across the Sahel. After conquest in 1874, Ali Dinar restored the sultanate in 1898; it ended under Anglo-Egyptian conquest in 1916. Its history is essential to western Sudan and should not be reduced to present-day conflict.",
  "Wadai Sultanate": "Wadai grew into a central Sahelian sultanate with Abéché as an important court and caravan centre. Its rulers maintained complex relations with Borno and Darfur and resisted French expansion before conquest in 1912. Its history shows the importance of inland trade and scholarship.",
  "Kingdom of Cazembe": "Cazembe was governed by a ruler known as the Mwata Kazembe and formed part of the wider Lunda political world. Its position along the Luapula connected copper-producing areas, farming and fishing communities, and trade routes toward the east coast. Portuguese expeditions recorded diplomatic encounters with its court."
};

const FESTIVAL_PROFILE_CONTEXT: Record<string, [string, string, string, string]> = {
  "Homowo": [
    "Ga oral histories connect the celebration with a severe period of hunger and the community's survival through changes in settlement, farming and food supply. The precise chronology belongs to tradition rather than one independently dated event, and local accounts can differ between Ga towns.",
    "Homowo is both remembrance and public thanksgiving. It renews family bonds, honours ancestors and affirms Ga language, identity and community authority. It is an important marker in the annual customary calendar, with preparations and dates varying between traditional areas.",
    "Preparations include customary observances and the cooking of kpokpoi or kpekple, a maize-based food associated with the festival. Traditional leaders and family heads perform sprinkling rites, while drumming, songs, dance, processions and family visits bring neighbourhoods together.",
    "Celebrations take place in Ga towns across Greater Accra, including Ga Mashie, La, Teshie and Nungua. Dates are set by local customary calendars, so the main public ceremonies do not fall on one identical day in every community."
  ],
  "Aboakyer": [
    "Effutu oral tradition links Aboakyer to the people's migration and a covenant with the deity Penkyi Otu. The annual bushbuck offering is understood within that religious history; accounts of the migration and the early form of the rite are preserved through community memory.",
    "The festival renews the relationship between the Effutu people, their traditional authorities and Penkyi Otu. The competition between the Asafo companies expresses courage, discipline and communal responsibility, alongside thanksgiving and collective identity.",
    "The two Asafo companies undertake a ceremonial hunt for a live bushbuck, which is presented to the deity according to established custom. Drumming, dancing, processions and a durbar of chiefs and people follow. The hunt is governed by community rules and is not an ordinary wildlife hunt.",
    "Aboakyer is celebrated in Winneba in the Effutu Traditional Area of Ghana's Central Region, usually on the first Saturday in May. Public events take place around the town and its traditional durbar grounds."
  ],
  "Hogbetsotso": [
    "Anlo-Ewe oral history recalls an exodus from Notsie, in present-day Togo, under oppressive rule. The story describes how ancestors escaped and travelled south to settle in the Keta and Volta estuary area. Details are transmitted through oral traditions and family accounts.",
    "The festival honours courage, liberation, unity and the responsibility to remember earlier generations. It creates space for reconciliation and community planning and renews connections among Anlo towns and their diaspora.",
    "Preparations commonly include community clean-ups, customary rites, historical storytelling, music and processions. The celebration reaches a public climax with a durbar of chiefs and people, speeches, dancing and displays of Anlo cultural dress and identity.",
    "The main celebration is associated with Anloga and the Anlo Traditional Area in Ghana's Volta Region. It is generally held in November, with related commemorations among Anlo communities elsewhere."
  ],
  "Fetu Afahye": [
    "Oguaa oral tradition recalls a devastating epidemic in Cape Coast and the community's appeal to its traditional deities for protection and cleansing. The name Fetu is commonly explained locally through a phrase associated with clearing away dirt or impurity. The origin story is part of community memory.",
    "The festival expresses gratitude, honours the traditional spiritual authorities of Oguaa and renews a collective commitment to the town's wellbeing. It also remembers ancestors and gives residents an occasion to assess community affairs and welcome people who have returned from elsewhere.",
    "Preparations include customary observances, public sanitation and traditional restrictions such as a temporary ban on fishing in Fosu Lagoon before designated rites. Ceremonies may include libation, processions, drumming, dancing, a canoe regatta, Asafo displays and a grand durbar.",
    "Fetu Afahye is celebrated by the Oguaa Traditional Area in Cape Coast, Central Region, Ghana. The principal public climax is normally held on the first Saturday of September, with related activities during the preceding week."
  ],
  "Damba": [
    "Damba developed among Dagomba and neighbouring northern Ghanaian communities through an interaction of Islamic historical memory and local chieftaincy traditions. It is associated with the birth and naming of Prophet Muhammad, although its customary form is not identical to a formal Islamic religious observance.",
    "The celebration highlights the place of chieftaincy in northern Ghana, community history and the region's long engagement with Islam. It is also an occasion for chiefs, elders and families to meet and reaffirm relationships.",
    "Activities vary by locality and can include drumming, praise singing, horse processions, traditional dance and a durbar of chiefs. The celebration follows a lunar month in the Dagomba calendar, so Gregorian dates change each year. Religious and customary interpretations should be distinguished.",
    "Damba is especially associated with Dagbon, including Tamale and Yendi in northern Ghana. Related observances occur in other northern communities, with local differences in timing and ceremony."
  ],
  "Akwasidae Festival": [
    "Akwasidae belongs to the Asante Adae calendar, a cycle of sacred days connected with royal ancestral stools and the traditional institutions of Asanteman. It is a recurring ceremonial observance, not simply an annual street festival.",
    "The day honours ancestors and deceased Asante rulers and affirms continuity between royal ancestors, the Asantehene, chiefs and the wider community. It is also an occasion for allegiance, counsel, respect and the public display of Asante history and regalia.",
    "The observance includes private palace rites and public ceremonies. The Asantehene receives chiefs, elders and guests in state; chiefs pay homage in order of precedence, while drumming, praise singing, kente and gold regalia and royal umbrellas are prominent. Akwasidae falls on a Sunday at the end of an Adae cycle, roughly every 40–42 days; dates must be checked against the current calendar.",
    "Manhyia Palace in Kumasi, Ashanti Region, is the best-known public venue. Related Adae observances take place in Asante traditional areas and among Asante communities in the diaspora."
  ],
  "Osun-Osogbo Festival": [
    "The festival grew from the sacred relationship between Osogbo and Osun, the Yoruba deity associated with the river and fertility. Oral traditions tell of a pact between the early community and Osun, and the sacred grove became a place of worship and protection.",
    "The celebration honours Osun and renews the relationship between the community, the river, the Ataoja traditional ruler and devotees. It is a major expression of Yoruba spirituality. The Osun-Osogbo Sacred Grove is recognised as a UNESCO World Heritage Site.",
    "Activities include rites, prayers, music, dance and a procession to the grove. A central feature is the Arugba, a young woman who carries a sacred calabash as part of the ritual procession. Priests, priestesses, custodians and community leaders all have roles.",
    "The festival takes place in Osogbo, Osun State, southwestern Nigeria, with ceremonies centred on the Osun-Osogbo Sacred Grove. The major annual celebration is generally held in August."
  ],
  "Sango Festival of Oyo": [
    "The festival is associated with Sango, a figure in Yoruba religious tradition linked to thunder, lightning and royal power, and with the history of the old Oyo kingdom. Traditions about Sango's life and transformation into an orisa are religious narratives told in different forms.",
    "It honours Sango and reinforces Yoruba cultural identity, ancestral memory and the continuity of traditional religious practice. For Oyo, it also recalls the city's royal history and its importance within the wider Yoruba world.",
    "Celebrations can include ritual observances, visits to sacred places, drumming, bata music, chants, dance and processions. Red and white clothing is often associated with Sango. Activities depend on the custodians and local ceremonial calendar.",
    "The principal celebration is associated with Oyo, Oyo State, Nigeria, and sites connected with Sango and the historic Oyo kingdom. Yoruba communities elsewhere may hold related events."
  ],
  "Timkat (Ethiopian Epiphany)": [
    "Timkat is the Ethiopian Orthodox Tewahedo Church's celebration of the baptism of Jesus in the River Jordan. It involves the tabot, a sacred object representing the Ark of the Covenant in each church, and has long-standing forms of worship.",
    "The festival expresses baptism, spiritual renewal, blessing and the shared identity of the church community. Its processions make visible the relationship between local congregations, clergy and Ethiopian Christian traditions.",
    "On the eve of Timkat, tabots are carried to a body of water with hymns, prayers and processions. The water is blessed and worshippers participate in a ceremonial reenactment of baptism. The tabots are then returned to their churches with further singing and observances.",
    "Timkat is celebrated throughout Ethiopia, usually on 19 January, or 20 January in leap-year adjustments. Major gatherings occur in Addis Ababa, Gondar and Lalibela, each with local features."
  ],
  "Meskel": [
    "Meskel commemorates the Ethiopian Orthodox tradition that Empress Helena discovered the True Cross in Jerusalem. The story is part of the church's religious tradition, and the festival has been observed in Ethiopia for centuries.",
    "For worshippers, Meskel represents the Cross, Christian faith, hope and continuity of the Ethiopian Orthodox community. It also brings neighbourhoods and families together through shared preparation, prayer and food.",
    "Communities assemble greenery and flowers around a large pyre known as the Demera. Clergy lead prayers and hymns before it is lit in a public ceremony. Further religious observances and family gatherings take place the following day.",
    "Meskel is celebrated across Ethiopia, generally on 27 September, or 28 September in leap-year adjustments. Meskel Square in Addis Ababa hosts a major national ceremony, alongside local observances."
  ],
  "Irreecha": [
    "Irreecha is an Oromo thanksgiving tradition associated with the transition from the rainy season to the drier season. Its practices are rooted in Oromo relationships with Waaqa and in seasonal cycles that sustain livestock, farming and community life.",
    "The festival expresses gratitude for life, peace, rain, fertility, harvest and the natural environment. It is also an important expression of Oromo identity, collective memory and unity across communities.",
    "Participants gather with fresh grass and flowers, often wearing traditional clothing, and offer prayers and thanks near water. Singing, dancing, speeches and community gatherings form part of the occasion. Local ceremonies may differ in detail.",
    "Irreecha is celebrated by Oromo communities across Ethiopia. Large gatherings take place at Hora Arsadi in Bishoftu and at sites in and around Addis Ababa."
  ],
  "Gifaataa": [
    "Gifaataa is a Wolaita New Year tradition transmitted through families and community institutions. Its date and sequence are rooted in the local calendar and oral custom, and practices can vary between villages and generations.",
    "The occasion welcomes a new year and is associated with peace, reconciliation, family connection, respect for elders and renewal of social relationships. It gives communities an opportunity to settle disagreements and begin the year with goodwill.",
    "Preparations can include cleaning homes and public spaces, preparing traditional foods and drinks, visiting relatives, receiving elders' blessings and sharing meals. Songs, dances, bonfires and other gatherings may form part of the celebration.",
    "Gifaataa is celebrated by Wolaita communities in southern Ethiopia, particularly in the Wolaita Zone around Sodo and neighbouring communities."
  ],
  "Fichee-Chambalaalla": [
    "Sidama oral tradition associates the festival with a married woman who returned to her parental home each year with food to share with neighbours and relatives. The story is remembered as an origin account for a celebration that became the Sidama New Year.",
    "It represents generosity, kinship, equality, social harmony and the value of sharing. The festival strengthens relationships between households and preserves Sidama cultural identity and customary knowledge.",
    "Traditional leaders and elders determine the date through customary procedures. Families prepare and share buurisame, while children and neighbours visit one another. Songs, dances, public gatherings and reconciliation activities accompany the celebration.",
    "The festival is observed by Sidama communities in southern Ethiopia, including around Hawassa. The exact date is announced according to the traditional calendar."
  ],
  "Moussem of Tan-Tan": [
    "The gathering developed from periodic meetings among Saharan nomadic and semi-nomadic communities. These enabled people to exchange goods, arrange marriages, share news, maintain alliances and coordinate around pastoral seasons and movement through desert routes.",
    "The Moussem preserves knowledge and social practices associated with Saharan nomadic life. It brings together communities whose histories cross modern borders and celebrates hospitality, oral poetry, music, horsemanship and camel culture.",
    "Activities include camel and horse displays, traditional games, music, dance, poetry, crafts, food markets and social gatherings. The modern festival also welcomes visitors and presents cultural practices in a public programme.",
    "It takes place in Tan-Tan in southwestern Morocco and draws participants from Saharan communities in Morocco and neighbouring parts of northwest Africa. The scale and programme vary by edition."
  ],
  "Yennayer (Amazigh New Year)": [
    "Yennayer marks the beginning of the Amazigh agricultural calendar and is observed across North Africa. The calendar is linked to seasonal farming cycles; explanations of its historical starting point differ, so it should not be presented as one universally agreed ancient event.",
    "The day celebrates renewal, abundance, family continuity and Amazigh language and identity. For many households it is also a time to express hopes for a successful farming year and pass traditions to children.",
    "Families prepare special meals using grains, legumes, fruit and seasonal produce and share food with neighbours. Stories, songs, traditional clothing and local customs vary among Amazigh communities in different regions.",
    "Yennayer is observed in Morocco, Algeria, Libya, Tunisia and Amazigh communities elsewhere. It is commonly marked on 12 or 13 January, depending on local calendar convention."
  ],
  "Moussem of Imilchil (Marriage Festival)": [
    "The gathering is associated with Ait Hadiddou Amazigh communities of the High Atlas. It is linked to seasonal meetings and local marriage customs; the popular story of two lovers from rival groups is a well-known legend, not a complete historical explanation.",
    "The Moussem provides a setting for social reunion, cultural continuity, local trade and Amazigh identity. The label Marriage Festival can oversimplify the varied reasons people attend and the event's changing modern format.",
    "The event includes a market, music, dance, traditional clothing and social visits. Families may use the gathering to discuss marriage arrangements, but it should not be portrayed as a mass arranged-marriage ceremony where visitors simply choose spouses.",
    "It takes place around Imilchil and nearby villages in Morocco's High Atlas Mountains, usually in late summer or early autumn. Dates and programme details vary."
  ],
  "Gule Wamkulu": [
    "Gule Wamkulu is a masked performance tradition associated with the Chewa people and the Nyau society. It is connected to initiation, funerals and community rites, with knowledge and roles transmitted through established cultural institutions.",
    "Masked figures can represent ancestors, animals, social types and symbolic characters. Through performance, the tradition communicates moral lessons, social criticism, community memory and ideas about the relationship between living people and ancestors.",
    "Performers wear masks and elaborate costumes and move to drums, songs and dance. Appearances occur at particular community events and follow customs governed by Nyau knowledge. Some ritual knowledge is not intended for public explanation, so descriptions should respect custodians' limits.",
    "Gule Wamkulu is practised among Chewa communities in Malawi, Mozambique and Zambia. Specific performances are organised locally rather than at one single national venue."
  ],
  "Umhlanga (Reed Dance)": [
    "Umhlanga is a royal ceremony in the Swazi kingdom in which groups of young women gather and cut reeds for use at the royal residence. The ceremony developed within monarchy traditions and has evolved in form over time.",
    "It is associated with service to the royal household, cultural continuity and collective participation by young women. It also creates a public occasion for cultural display and the transmission of songs, dress and ceremonial practice.",
    "Participants gather reeds, carry them in procession and perform traditional songs and dances before the royal family. Participation is organised through customary structures, and the programme follows protocols set by the monarchy.",
    "The main public observance is held at Ludzidzini Royal Residence in Eswatini, with reed gathering at designated locations. Timing is announced according to the royal calendar."
  ],
  "Incwala": [
    "Incwala is a major kingship ceremony rooted in the Swazi royal calendar and first-fruits traditions. It is associated with the seasonal cycle and the symbolic renewal of the monarch's relationship with the nation. Its ritual knowledge is held within the kingdom's ceremonial institutions.",
    "The ceremony expresses national renewal, continuity of the monarchy and the relationship between the king, ancestral authority and the people. It is one of the most important events in the royal calendar and is distinct from a general public festival.",
    "The multi-stage observance includes the gathering of sacred branches, processions, ritual acts and collective singing and dancing. The king and designated participants have prescribed roles, and some rites are restricted or governed by protocol.",
    "Incwala is held at royal sites in Eswatini, with key events centred on royal residences and places designated by the monarchy. Timing follows the traditional calendar and is announced locally."
  ],
  "Mwaka Kogwa": [
    "Mwaka Kogwa is a Shirazi-influenced New Year celebration associated with Zanzibar's historical connections with the Persian Gulf. Its customs developed locally and became part of the cultural life of particular communities on the island.",
    "The celebration marks a new year and symbolically allows people to leave old grievances behind, restore relationships and seek wellbeing. It combines local social practice with influences from the wider Indian Ocean world.",
    "At Makunduchi, the best-known observance includes symbolic mock fighting with banana stems, songs, dances and communal feasting. The ritualised contest is followed by activities intended to restore harmony. Customs differ between local settings.",
    "The best-known Mwaka Kogwa celebration takes place in Makunduchi in southern Zanzibar, Tanzania, usually around July. Local dates and arrangements should be checked each year."
  ],
  "Maulidi ya Lamu": [
    "The Lamu Maulidi is associated with the commemoration of Prophet Muhammad's birth and the long-standing Islamic scholarship of the Swahili coast. Lamu's religious institutions, mosques and poetry traditions have shaped the gathering over generations.",
    "The event expresses devotion, learning, hospitality and the shared heritage of Swahili Muslim communities. It brings residents and visitors together in a setting where religious teaching and cultural exchange are closely connected.",
    "Activities can include Quran recitation, devotional poetry, prayers, processions, religious lectures and hospitality. Some editions include cultural competitions and public events, while religious observances remain central.",
    "The festival is centred on Lamu Old Town and Lamu Island on Kenya's coast. Its date follows the Islamic lunar calendar and changes each year."
  ],
  "Grand Magal of Touba": [
    "The Magal commemorates the 1895 exile of Sheikh Amadou Bamba by French colonial authorities. It became a central annual gathering for the Mouride brotherhood, whose spiritual centre is Touba and whose history is closely associated with Bamba's teachings.",
    "It honours religious commitment, perseverance, service, learning and the memory of Sheikh Amadou Bamba. For Mourides, the pilgrimage is an act of devotion and a reaffirmation of ties to the brotherhood and its spiritual leadership.",
    "Pilgrims travel to Touba for prayers, Quran recitation, religious lectures and visits to the Great Mosque and the mausoleum of Amadou Bamba. Hospitality is a major feature, with families and organised groups providing food and accommodation.",
    "The Magal takes place in Touba, Senegal, on the 18th day of the Islamic month of Safar. The Gregorian date changes annually, and pilgrims arrive from Senegal and the wider diaspora."
  ],
  "Kankurang Manding Initiation": [
    "The Kankurang is a masked figure associated with Manding initiation traditions and initiation societies. Its form, materials and role vary by community, but it is understood as a protective presence linked to social knowledge and customary authority.",
    "The figure represents protection, discipline, moral instruction and the transmission of knowledge between generations. The tradition marks social responsibilities associated with initiation and the relationship between community and ancestral heritage.",
    "A performer wears a costume made from materials such as bark and fibres and appears with songs, percussion and processions during designated events. The performance follows local custodians' rules; some initiation knowledge and ceremonies are not public.",
    "The tradition is practised among Manding communities in The Gambia and Senegal, including parts of Casamance and the wider Senegambian region. UNESCO has recognised Kankurang as intangible cultural heritage."
  ],
  "Sanké Mon": [
    "Sanké Mon is linked to the founding history of San and the community's relationship with Sanké pond. It is a seasonal rite associated with the start of the rainy season and customary management of a shared water resource.",
    "The event expresses collective responsibility, social solidarity, peace and the community's relationship with water and the environment. It is also a marker of local identity and a way of renewing ties among neighbourhoods and families.",
    "The main feature is a collective fishing event at the pond, accompanied by music, dance and cultural performances. Customary rules govern the gathering and the use of the water resource, bringing residents and visitors together.",
    "Sanké Mon is celebrated in San in Mali's Ségou Region, at Sanké pond. It is traditionally linked to the beginning of the rainy season."
  ],
  "Yaaral and Degal": [
    "Yaaral and Degal are seasonal gatherings connected with Fulani pastoralists moving cattle across the floodplains of the inland Niger Delta. They follow the annual rhythm of rising and receding water, pasture availability and pastoral decision-making.",
    "The events celebrate livestock knowledge, mobility, cooperation and pastoral identity. They also highlight the importance of the inland delta's wetlands and grazing systems to local livelihoods and the regional economy.",
    "Families and herders gather as cattle move across grazing areas. Decorated herds, poetry, songs, music, dance and public competitions form part of the celebrations. Timing depends on ecological conditions and the seasonal flood cycle.",
    "The gatherings are associated with Mali's inland Niger Delta, especially areas around Diafarabé and Djenné. Local timing changes according to flood and grazing conditions."
  ],
  "Famadihana (Turning of the Bones)": [
    "Famadihana is practised by some Malagasy families, especially in parts of the central highlands. It is connected to ancestral remembrance and family tomb traditions. Families and local customs determine its timing rather than a single national calendar.",
    "The ceremony expresses respect for ancestors, family continuity and the belief that the living remain connected to earlier generations. It is not practised by all Malagasy communities, and religious attitudes and family choices differ.",
    "Where observed, relatives gather at a family tomb, bring fresh shrouds and rewrap ancestral remains according to local practice. Music, dancing, speeches and shared meals may accompany the event. It can be costly and is not held at fixed annual intervals.",
    "Famadihana is associated particularly with some Merina and Betsileo communities in Madagascar's central highlands. It occurs when a family decides the time is appropriate, sometimes after several years."
  ],
  "Lake of Stars Festival": [
    "Lake of Stars began in the 2000s as a contemporary Malawian music and arts festival. It was created to showcase Malawian talent and connect local performers with audiences and artists from other countries. It is modern, not an ancient customary festival.",
    "The festival promotes artistic exchange, creative industries, tourism and international visibility for Malawian musicians and artists. Its significance lies in contemporary cultural expression and the networks it creates for performers and audiences.",
    "Programmes have included live music, DJ performances, dance, visual arts, talks, food and community activities. The line-up and format change by edition, and the event has used different venues around Lake Malawi.",
    "It takes place in Malawi, often at venues on or near Lake Malawi. The host location, dates and programme vary, so current event information should be checked before travel."
  ],
  "Cape Town Minstrel Carnival (Kaapse Klopse)": [
    "The carnival developed from New Year celebrations among Cape Town's enslaved and working-class communities during the colonial period. Its history reflects the cultural creativity of people denied freedom and social equality, and later developed into organised minstrel troupes.",
    "Kaapse Klopse expresses community belonging, creativity, resilience and the history of Cape Town's Coloured communities. Its music and performance carry memories of slavery, labour, neighbourhood identity and changing urban life.",
    "Minstrel troupes parade in coordinated colourful clothing with brass instruments, banjos, drums, singing and dance. Groups rehearse for months and participate in competitions and street processions organised by community associations.",
    "The carnival is held in Cape Town, Western Cape, South Africa, around the New Year period. Parades and competitions take place at different city venues and community routes."
  ],
  "Okyir Festival (Anomabo)": [
    "Okyir, also called Okyir Okyir in local usage, is a Fante festival associated with Anomabo. Its history is linked to the community's seasonal calendar, thanksgiving and customary ideas of cleansing and renewal. The specific origin should be explained through Anomabo's own traditional accounts.",
    "The festival gives thanks, honours ancestors and renews the community. It is also a time to address shared concerns, review local progress and strengthen relationships among the chief, Asafo companies, residents and people returning from outside the town.",
    "Preparations include cleaning homes and public spaces. Asafo companies and community groups take part in processions, and the celebration reaches a climax with a durbar of chiefs and people. Cultural performances, music, dance and public discussion are also part of the programme.",
    "Okyir is celebrated in Anomabo in Ghana's Central Region, usually in the second week of October. Dates and programme details are set locally by the traditional authorities."
  ]
};

const TOURIST_SITE_PROFILE_DETAILS: Record<string, { history: string; significance: string; locationDetail: string; visitorExperience: string }> = {
  "Great Pyramid of Giza and the Giza Plateau": {
    "history": "Built during Egypt's Fourth Dynasty in the Old Kingdom, the Giza complex includes the pyramids of Khufu, Khafre and Menkaure, their associated temples and tomb fields. The Great Pyramid was constructed for Khufu around the 26th century BCE; the Sphinx and other monuments belong to this wider royal funerary landscape.",
    "significance": "The plateau demonstrates ancient Egypt's engineering, administration, quarrying, transport and skilled craft traditions. It is a major source for understanding Old Kingdom kingship, religious beliefs about death and the afterlife, and the organisation of labour and resources.",
    "locationDetail": "The plateau lies on the western edge of the Nile Valley at Giza, southwest of central Cairo. The main visitor zone includes the three pyramids, the Great Sphinx, causeways, valley temples and surrounding tomb fields.",
    "visitorExperience": "Visitors can walk between the monuments, view the pyramids from several viewpoints and see the Sphinx and associated temples. Some interior chambers require separate tickets and may have restrictions. The terrain is open and exposed, so allow time for walking and follow site rules."
  },
  "Karnak Temple Complex": {
    "history": "Karnak developed over more than a thousand years, with major building phases from the Middle Kingdom through the Ptolemaic period. Pharaohs added pylons, courts, obelisks, sanctuaries and the Great Hypostyle Hall, creating a monumental centre dedicated chiefly to Amun and the Theban divine triad.",
    "significance": "Karnak was a principal religious and ceremonial centre of ancient Thebes. Its inscriptions and changing architectural forms document Egyptian religion, royal patronage, military campaigns and artistic development across many dynasties.",
    "locationDetail": "The complex stands on the east bank of the Nile at Luxor in Upper Egypt, north of Luxor Temple. It forms part of the wider ancient Theban religious landscape.",
    "visitorExperience": "Visitors follow monumental processional routes through pylons, courtyards and columns. The Hypostyle Hall, obelisks, sacred lake and carved reliefs are highlights. The site is extensive and mostly outdoors, so a guide or map and time to walk slowly are useful."
  },
  "Valley of the Kings": {
    "history": "The Valley became the principal royal burial ground for New Kingdom pharaohs from around the sixteenth century BCE. Rulers commissioned hidden rock-cut tombs decorated with religious texts and scenes intended to guide them through the afterlife; the discovery of Tutankhamun's tomb in 1922 brought worldwide attention.",
    "significance": "The tombs preserve an exceptional record of royal burial practices, religious belief and painting in ancient Egypt. They reveal how pharaohs understood death, divine protection and the journey into the next world.",
    "locationDetail": "It lies on the west bank of the Nile opposite Luxor, within the Theban Necropolis. The surrounding landscape includes royal and private tombs, mortuary temples and the Valley of the Queens.",
    "visitorExperience": "Visitors enter a selection of tombs, which may rotate or close for conservation. Painted corridors, ceilings and chambers can be seen at close range; photography and extra entry rules vary. The interiors can be warm, enclosed and uneven underfoot."
  },
  "Abu Simbel Temples": {
    "history": "Ramesses II commissioned the two rock-cut temples in the thirteenth century BCE. The Great Temple honours the king and major Egyptian deities, while the smaller temple is associated with Queen Nefertari and Hathor. In the 1960s the temples were dismantled and moved to higher ground to save them from the rising waters of Lake Nasser.",
    "significance": "The statues, reliefs and solar alignment demonstrate ancient Egyptian monumental design and royal ideology. The modern rescue operation became a landmark in international heritage conservation and helped inspire the World Heritage movement.",
    "locationDetail": "The temples stand on the western shore of Lake Nasser in Egypt's far south, near the Sudanese border and south of Aswan. They form part of the Nubian Monuments heritage area.",
    "visitorExperience": "Visitors approach the colossal statues and enter halls decorated with royal scenes and religious reliefs. The interior sanctuary and smaller temple offer close views of rock-cut architecture. The site is remote, so travel is usually planned from Aswan and should be arranged in advance."
  },
  "Medina of Marrakesh and Jemaa el-Fnaa": {
    "history": "Marrakesh was founded in the eleventh century by the Almoravids and grew under successive dynasties into a political, religious and commercial centre. The medina contains Almoravid, Almohad, Saadian and later layers, while Jemaa el-Fnaa developed as a public space for markets, storytelling, performance and everyday city life.",
    "significance": "The medina reflects Morocco's urban history and cultural exchange linking the Maghreb, Sahara and Mediterranean. Jemaa el-Fnaa is especially significant as a living space for oral traditions, food culture and public performance.",
    "locationDetail": "The medina is the historic centre of Marrakesh in central-southern Morocco, west of the High Atlas. Jemaa el-Fnaa is its best-known square, close to the Koutoubia Mosque and traditional souks.",
    "visitorExperience": "Visitors explore lanes, souks, palaces, gardens and historic buildings; the square changes character through the day and evening. Food stalls and performers are part of its atmosphere. The dense street network is best explored on foot, with respect for residents and performers."
  },
  "Medina of Fez": {
    "history": "Fez was founded in the late eighth century and became one of Morocco's leading centres of scholarship, craftsmanship and trade. Fes el-Bali contains medieval streets, mosques, madrasas, fountains, fondouks and craft quarters shaped by Idrisid, Marinid and later dynasties.",
    "significance": "The medina is an outstanding example of a living medieval Islamic city. Its urban layout, religious institutions, artisan production and educational traditions show the historic importance of Fez in the Maghreb.",
    "locationDetail": "Fes el-Bali lies in the historic core of Fez in northern-central Morocco. The wider city also includes Fes el-Jdid and the modern Ville Nouvelle.",
    "visitorExperience": "Visitors walk through narrow lanes lined with workshops, markets, courtyards and historic buildings. Guided walks can explain crafts and the old tanneries. Some religious buildings are not open to non-Muslim visitors, and the maze-like streets make local guidance helpful."
  },
  "Ksar of Aït-Ben-Haddou": {
    "history": "Aït-Ben-Haddou is a fortified earthen settlement that developed along routes connecting the Sahara with Marrakesh and other Moroccan trading centres. Its walls, towers, granaries and clustered houses reflect the needs of communities living in a strategic river valley.",
    "significance": "The ksar is an important example of southern Moroccan earthen architecture and collective settlement planning. Its construction techniques using earth and timber show how local communities adapted buildings to climate, trade and defence.",
    "locationDetail": "It stands beside the Ounila River in Ouarzazate Province, south of the High Atlas. It lies on historic routes linking the desert and Marrakesh.",
    "visitorExperience": "Visitors cross the river or bridge and climb through the settlement's lanes toward the upper granary and hilltop viewpoints. The experience combines architecture and valley scenery. Some buildings are private or closed, so visitors should respect residents and avoid entering restricted structures."
  },
  "Chefchaouen Old Town": {
    "history": "Chefchaouen was founded in the fifteenth century as a fortified settlement in the Rif Mountains during a period of Iberian expansion. Andalusian and Moroccan influences shaped its built environment and religious life as it grew into a regional centre.",
    "significance": "The medina is valued for its mountain setting, traditional houses and layered Andalusian-Moroccan heritage. Its blue-painted lanes are now internationally recognisable, although the colour tradition has changed over time and has several explanations.",
    "locationDetail": "Chefchaouen lies in the Rif Mountains of northern Morocco, inland from the Mediterranean coast. The historic medina occupies a slope below the surrounding mountains.",
    "visitorExperience": "Visitors explore pedestrian streets, small squares, craft shops and viewpoints, with opportunities to see traditional architecture and mountain scenery. The town is hilly, with steps and uneven paving; treat residential lanes as private community spaces."
  },
  "Carthage Archaeological Site": {
    "history": "Carthage was founded by Phoenician settlers in the first millennium BCE and became the centre of a powerful maritime state. Rome destroyed the city in 146 BCE after the Punic Wars, then established a major Roman city on the same site; later periods added further layers.",
    "significance": "Carthage is central to ancient Mediterranean history, illustrating Phoenician seafaring, North African political power, trade and Roman urbanism. Its archaeological remains reveal successive cultural and political transformations.",
    "locationDetail": "The remains are spread across the modern suburb of Carthage on the coast northeast of Tunis. Key areas include Byrsa Hill, the Antonine Baths, Punic ports and residential and funerary zones.",
    "visitorExperience": "Visitors move between several separate archaeological areas rather than one enclosed site. The baths, ports, museum collections where open and Mediterranean views are highlights. A guide or transport helps connect the dispersed monuments."
  },
  "El Jem Amphitheatre": {
    "history": "The amphitheatre was built in the Roman period, probably in the third century CE, when Thysdrus prospered through olive-oil production and trade. Its scale reflects the wealth of the region and the importance of public spectacles in Roman urban life.",
    "significance": "El Jem is one of the largest and best-preserved Roman amphitheatres in North Africa. Its seating, arena and underground spaces reveal Roman engineering and the civic life of a prosperous provincial city.",
    "locationDetail": "The monument stands in the modern town of El Jem in Tunisia's Mahdia Governorate, in the central Sahel between Sousse and Sfax.",
    "visitorExperience": "Visitors can walk through the arena, corridors and seating levels and look into underground passages. Upper levels convey the scale of the structure and the surrounding town. Stairways and surfaces are uneven and the open monument is exposed to sun."
  },
  "Leptis Magna": {
    "history": "Leptis Magna developed from a Phoenician settlement into a major Roman city, reaching particular splendour under Emperor Septimius Severus, who was born there. Its harbour, forum, basilica, market, baths and theatre reflect its role in Mediterranean commerce and imperial administration.",
    "significance": "It is among the most impressive surviving Roman urban landscapes in the Mediterranean. The ruins show how a North African city became a major provincial centre and how Roman architecture adapted to local geography and political ambition.",
    "locationDetail": "Leptis Magna lies on Libya's Mediterranean coast near Al Khums, east of Tripoli. The archaeological zone extends from the ancient harbour to inland civic monuments.",
    "visitorExperience": "Where access is permitted and conditions are safe, visitors can see the theatre, Severan Forum, basilica, baths, colonnaded streets and harbour remains. The site is extensive and open-air. Libya's security, travel permissions and heritage access must be checked with official authorities before travel."
  },
  "Tassili n'Ajjer": {
    "history": "Tassili n'Ajjer contains thousands of rock-art images created over millennia, including scenes of cattle herding, wildlife, hunting and human activity. The paintings and engravings record a time when parts of the Sahara were greener and supported communities very different from those of today's desert.",
    "significance": "The plateau is a major archive of prehistoric art and environmental change. It helps researchers understand the changing climate of the Sahara and the lives, beliefs and artistic expression of early Saharan communities.",
    "locationDetail": "The plateau occupies a vast area in southeastern Algeria, centred around Djanet and extending toward the Libyan and Nigerien borders. Rock-art locations are scattered across remote valleys and escarpments.",
    "visitorExperience": "Visits generally require local guides, 4x4 transport and sometimes multi-day walking or camping routes. Visitors can see rock shelters, arches, dunes and selected painted or engraved panels. The environment is remote and fragile; never touch the rock art."
  },
  "Cape Coast Castle": {
    "history": "The fortress developed from earlier European trading activity on the Gold Coast and was expanded under Swedish, Dutch and British control. It became deeply involved in the Atlantic slave trade, holding enslaved Africans before forced embarkation; it later served other colonial and administrative purposes.",
    "significance": "Cape Coast Castle is a major place of remembrance for the transatlantic slave trade and the African diaspora. It also represents centuries of African-European commerce, diplomacy and colonial power along the coast.",
    "locationDetail": "The castle stands on the shoreline of Cape Coast in Ghana's Central Region, within the historic town and the UNESCO-listed group of Ghana's forts and castles.",
    "visitorExperience": "Guided visits pass through courtyards, defensive spaces, governors' quarters, dungeons and memorial spaces associated with forced embarkation. The experience can be emotionally difficult and benefits from careful historical interpretation. Museum exhibits complement the tour."
  },
  "Elmina Castle": {
    "history": "The Portuguese built São Jorge da Mina in 1482 as a fortified trading post, initially focused on gold and coastal commerce. The Dutch captured it in 1637; it later became a major site in the Atlantic slave-trading system, before British control in the nineteenth century.",
    "significance": "Elmina Castle is among the oldest surviving European-built structures in sub-Saharan Africa and a key witness to the transformation from coastal trade to the trafficking of enslaved Africans. Its history also reflects African-European relations and diaspora memory.",
    "locationDetail": "The castle occupies a promontory beside Elmina's fishing harbour in Ghana's Central Region, west of Cape Coast. The surrounding town retains a historic fishing and trading landscape.",
    "visitorExperience": "A guided visit typically covers the courtyard, governors' rooms, dungeons, cannons and the seaward exit associated with forced embarkation. The tour can be distressing but important for understanding the history. Visitors can also explore Elmina town respectfully."
  },
  "Kakum National Park": {
    "history": "Kakum protects a remnant of the Upper Guinean rainforest in Ghana's Central Region. The forest has ecological and community importance, and the protected area was established to conserve habitats and wildlife while supporting nature education and managed tourism.",
    "significance": "The park protects biodiversity in a region where tropical forest has been reduced by settlement and resource use. It is known for forest birds, butterflies, plants and mammals and demonstrates the value of rainforest conservation in Ghana.",
    "locationDetail": "Kakum lies in the Assin Attandanso area of the Central Region, inland from Cape Coast and Elmina. The visitor entrance and canopy walkway are within the protected forest landscape.",
    "visitorExperience": "Visitors can take guided forest walks and, when operating, cross the elevated canopy walkway for views into the forest. Guides help identify plants, birds and wildlife signs; larger mammal sightings are not guaranteed. Follow staff instructions, especially on suspended bridges."
  },
  "Osun-Osogbo Sacred Grove": {
    "history": "The grove developed as a sacred landscape associated with Osun, the Yoruba deity linked to the river. Its shrines, sculptures and ritual spaces have been maintained by priests, devotees, artists and community custodians over generations.",
    "significance": "The grove is a rare surviving example of a Yoruba sacred forest and a living religious place, not simply an archaeological park. Its artworks and shrines record the continuing importance of traditional spiritual practice in contemporary Nigeria.",
    "locationDetail": "It lies on the outskirts of Osogbo, capital of Osun State in southwestern Nigeria, within a forest along the Osun River.",
    "visitorExperience": "Visitors may follow designated paths to see shrines, sculptures, river settings and ritual spaces, usually with guidance. It remains sacred to worshippers, so photography, movement and behaviour should respect local rules and ceremonies. Festival periods may bring crowds and special restrictions."
  },
  "Olumo Rock": {
    "history": "Olumo Rock served as a refuge for Egba communities during nineteenth-century conflicts. Abeokuta, whose name is commonly interpreted as 'under the rock', grew in relation to this defensive landscape and the histories of Egba migration and political organisation.",
    "significance": "The rock is closely tied to the founding history and identity of Abeokuta and the resilience of the Egba people. Caves and shelters on the outcrop show how geography shaped settlement, security and community memory.",
    "locationDetail": "Olumo Rock rises in central Abeokuta, capital of Ogun State in southwestern Nigeria. The site overlooks the city and is accessible from the urban centre.",
    "visitorExperience": "Visitors can climb stairs and guided routes to caves, historic resting places and viewpoints over Abeokuta. The ascent combines natural geology and cultural interpretation. Some sections are steep or narrow, so follow guides and use installed paths."
  },
  "Royal Palaces of Abomey": {
    "history": "The palace complex developed as the political centre of the Kingdom of Dahomey from the seventeenth century onward. Successive kings built compounds, ceremonial courtyards and decorated walls to express dynastic authority; the site was damaged during the French conquest.",
    "significance": "The palaces preserve evidence of Dahomey's monarchy, artistic traditions, military organisation and court ceremonies. Their bas-reliefs and royal objects help interpret both the kingdom's achievements and its involvement in warfare and the Atlantic slave trade.",
    "locationDetail": "The complex is in Abomey, in Benin's Zou Department, on the Abomey plateau south of Bohicon.",
    "visitorExperience": "Visitors can explore palace courtyards, preserved or reconstructed buildings and museum displays about Dahomey's rulers. A local guide can explain royal symbols and reliefs. Some objects and buildings may be unavailable during conservation or ceremonial use."
  },
  "Kunta Kinteh Island and Related Sites": {
    "history": "The island, formerly James Island, was a fortified European trading post on the Gambia River. Its changing control by European powers and its role in Atlantic commerce connect it to the capture, sale and forced transportation of enslaved Africans; nearby Juffureh and Albreda preserve related histories.",
    "significance": "The island and associated sites form a heritage landscape of the Atlantic slave trade and resistance. The Kunta Kinteh name is connected to oral history and the story popularised by Alex Haley, while the wider landscape records the experiences of many communities.",
    "locationDetail": "Kunta Kinteh Island lies in the Gambia River near Juffureh and Albreda, upriver from Banjul. Related heritage points are spread along the riverbank.",
    "visitorExperience": "A visit commonly involves a river journey to the island, viewing surviving ruins and interpreting the trading post's history, followed by visits to associated communities or museums where available. Access depends on river and weather conditions; local guides add important context."
  },
  "Island of Gorée": {
    "history": "Gorée was occupied and used by several European powers from the fifteenth century as they competed for Atlantic trade. Its houses, fortifications and harbour reflect centuries of commerce, colonial rule and slavery; the House of Slaves is its best-known memorial site, though the island's history is broader than one building.",
    "significance": "Gorée is an internationally recognised place of remembrance for slavery and the diaspora. Its architecture and museums also reveal the history of Senegal's coast, African-European contact and Dakar's development as a colonial port.",
    "locationDetail": "The island lies off Dakar in Senegal, a short boat crossing from the capital's harbour. Historic buildings and memorial sites are concentrated in a small pedestrian settlement.",
    "visitorExperience": "Visitors usually arrive by ferry and walk through narrow streets, museums, fortifications and memorial spaces. The House of Slaves and other museums provide historical interpretation, while the waterfront offers views of Dakar. A guide can help distinguish documented history from popular simplifications."
  },
  "Djoudj National Bird Sanctuary": {
    "history": "The Senegal River delta has long been important for fishing, agriculture and seasonal bird movement. Djoudj was protected to conserve the floodplain, lakes, marshes and reed beds that support resident and migratory birds.",
    "significance": "The sanctuary is a major stopover and breeding habitat along the East Atlantic Flyway. Pelicans, flamingos, herons and many other waterbirds demonstrate the importance of wetland conservation in the Sahel.",
    "locationDetail": "Djoudj lies in northern Senegal in the Senegal River delta, northeast of Saint-Louis and near the Mauritanian border.",
    "visitorExperience": "During suitable seasons, visitors can explore by boat or designated routes with local guides and observe birds at lakes and nesting areas. Bird numbers vary with water levels and migration seasons. Maintain distance, avoid noise and follow rules for sensitive breeding sites."
  },
  "Old Towns of Djenné": {
    "history": "Djenné developed as a trading and religious centre in the Inland Niger Delta, with settlement history extending back many centuries. Its architecture reflects a long tradition of building in banco, an earthen material maintained through collective repair; the Great Mosque is its most prominent monument.",
    "significance": "Djenné illustrates the relationship between Sahelian urbanism, trans-Saharan trade, Islam, scholarship and local architectural knowledge. The mosque's maintenance traditions express community cooperation and the continuing life of the town's building culture.",
    "locationDetail": "Djenné lies in central Mali within the Inland Niger Delta, on a seasonal island between branches of the Bani River. The historic town is surrounded by floodplain landscapes and nearby archaeological settlements.",
    "visitorExperience": "Visitors can walk through earthen streets, view decorated facades and explore the market area. Non-Muslim access to the mosque interior is generally restricted, and visitors should respect worship and local rules. Current security and travel conditions in central Mali must be checked before planning a trip."
  },
  "Timbuktu": {
    "history": "Timbuktu grew from a Saharan-edge settlement into a major commercial and intellectual city, reaching prominence during the Mali and Songhai periods. Merchants connected Saharan salt with gold and goods from the south, while scholars and manuscript collectors built a renowned tradition of Islamic learning.",
    "significance": "The city was a major centre of Islamic scholarship and manuscript culture in the fifteenth and sixteenth centuries. Djingareyber, Sankore and Sidi Yahia mosques, mausoleums and libraries testify to its spiritual, educational and trading history.",
    "locationDetail": "Timbuktu stands near the southern edge of the Sahara in northern Mali, west of the Niger River's main bend. Historic quarters and monuments are distributed across the old city.",
    "visitorExperience": "When safe and accessible, visitors can learn about earthen mosques, historic neighbourhoods, manuscript traditions and trans-Saharan trade with local guides. Monuments need careful conservation and the desert environment affects the buildings. Security conditions in northern Mali can change rapidly; check official advice and local authorisation."
  },
  "Historic Town of Grand-Bassam": {
    "history": "Grand-Bassam became an important French colonial administrative and trading centre in the late nineteenth and early twentieth centuries. Its European quarter, African settlement and waterfront developed through the colonial port economy, with buildings reflecting commercial and administrative uses.",
    "significance": "The town provides evidence of colonial urban planning and interactions between African communities and European administration on the Gulf of Guinea. Its historic district preserves memories of coastal commerce and the transition of the colonial capital.",
    "locationDetail": "Grand-Bassam lies on Côte d'Ivoire's southeastern coast, east of Abidjan, between the Atlantic shore and lagoon environment. The historic quarter is close to the beach and old harbour.",
    "visitorExperience": "Visitors can walk through the historic quarter to see colonial-era houses, public buildings, museums and the coastal setting. Local guides help explain the town's layers of history. Buildings differ in condition and some are privately occupied, so interior access is selective."
  },
  "Koutammakou, Land of the Batammariba": {
    "history": "Koutammakou is the homeland of the Batammariba, whose distinctive tower-houses, known as takienta, developed through local building knowledge and social traditions. The landscape has been shaped by generations of settlement, farming, ritual practice and relationships between households and the environment.",
    "significance": "The site is a living cultural landscape where architecture, belief, family organisation and land use are closely connected. The takienta are not merely unusual buildings; their form reflects Batammariba ideas about household, protection and community.",
    "locationDetail": "Koutammakou extends across the Kara Region of northern Togo and into neighbouring Benin. Villages are dispersed through a rural landscape of fields and hills.",
    "visitorExperience": "Visitors may see traditional tower-houses and learn from local guides about construction and cultural practice. Because the landscape is inhabited and some spaces are sacred, visits should be arranged with community consent. Do not enter homes or ritual areas without permission."
  },
  "Ruins of Loropéni": {
    "history": "The stone enclosure at Loropéni is associated with the history of gold production and regional trade in the Lobi area. Its builders, exact dates and original functions remain subjects of archaeological study, so it should not be attributed to one kingdom without evidence.",
    "significance": "Loropéni is an important archaeological site in a region shaped by gold extraction, exchange and movement between forest and Sahel. Its substantial stone walls are unusual in the area and provide evidence of complex settlement and construction.",
    "locationDetail": "The ruins are in southwestern Burkina Faso near the town of Loropéni, close to the borders with Côte d'Ivoire and Ghana.",
    "visitorExperience": "Visitors can view sections of the stone enclosure and surrounding landscape, often with local interpretation about what is known and what remains uncertain. Facilities may be limited. Check current security, road and access conditions before travelling."
  },
  "Mount Cameroon": {
    "history": "Mount Cameroon is an active stratovolcano whose eruptions and lava flows shaped the Southwest Region. The mountain has long been part of local communities' cultural and agricultural histories, while scientific expeditions and climbing traditions developed over generations.",
    "significance": "At more than 4,000 metres, it is the highest mountain in West and Central Africa and an important centre of volcanic research and biodiversity. Its forests and montane habitats show how elevation and volcanic soils shape the region.",
    "locationDetail": "The mountain rises near the Gulf of Guinea in southwestern Cameroon, overlooking Buea and Limbe. The national park includes forested slopes and high volcanic terrain.",
    "visitorExperience": "Visitors can take guided hikes through forest and high-altitude landscapes, with routes varying in length and difficulty. The annual Mount Cameroon Race of Hope is a major sporting event. Weather changes quickly; trekking requires preparation, a guide and appropriate gear."
  },
  "Foumban Royal Palace": {
    "history": "The palace is associated with the Bamum kingdom and its dynastic rulers. Sultan Njoya, who ruled in the late nineteenth and early twentieth centuries, supported the development of a Bamum writing system and promoted court arts, historical recording and architectural projects.",
    "significance": "The palace and museum preserve the history of Bamum kingship, craftsmanship and political creativity. The Bamum script, royal objects, masks, textiles and carved works show how a Central African court developed intellectual and artistic institutions.",
    "locationDetail": "The palace stands in Foumban, capital of the Noun Department in Cameroon's West Region, in the historic centre of the Bamum kingdom.",
    "visitorExperience": "Visitors can explore museum displays of royal objects, regalia, historical documents and Bamum artworks. A local guide can explain palace symbolism and Sultan Njoya's history. Access to particular rooms and collections can vary."
  },
  "Mbanza Kongo": {
    "history": "Mbanza Kongo was the capital of the Kingdom of Kongo and became a major political centre before and after Portuguese contact in the late fifteenth century. Its rulers developed diplomatic and religious ties with Portugal, including the adoption of Christianity by some members of the royal court.",
    "significance": "The site represents one of Central Africa's most influential states and its early engagement with global trade, Christianity and Atlantic politics. Archaeological remains and churches reveal the transformation of the royal capital and the later effects of warfare and colonial rule.",
    "locationDetail": "Mbanza Kongo is in Zaire Province in northwestern Angola, inland from the Atlantic coast and near the border with the Democratic Republic of the Congo.",
    "visitorExperience": "Visitors can explore the historic centre, museum and remains associated with the former royal capital, including religious and archaeological landmarks. Guided visits help connect surviving structures with the wider Kingdom of Kongo."
  },
  "Kalandula Falls": {
    "history": "Kalandula Falls is formed by the Lucala River as it drops over a broad escarpment. The waterfall has long been part of local landscape knowledge and community life in the Malanje region.",
    "significance": "The falls are among Africa's major waterfalls by width and are a prominent natural attraction in Angola. The site is valued for its scale, spray, forested surroundings and contribution to regional nature tourism.",
    "locationDetail": "The falls are on the Lucala River in Malanje Province in north-central Angola, several hours by road from Malanje city depending on route and conditions.",
    "visitorExperience": "Visitors can view the falls from designated viewpoints and, where permitted, explore paths toward lower or side viewpoints. Water volume changes with the seasons. Paths can be slippery and mist reduces visibility, so local guidance and care near the gorge are important."
  },
  "Virunga National Park": {
    "history": "Established in 1925 as Albert National Park under Belgian colonial administration, Virunga is Africa's oldest national park. Its management changed after Congolese independence, and the park has faced armed conflict, displacement, poaching and conservation pressures.",
    "significance": "Virunga protects habitats from lowland forests to volcanic mountains and is known for mountain gorillas, other wildlife and active volcanic landscapes. Its conservation is internationally important but closely linked to security and the lives of neighbouring communities.",
    "locationDetail": "The park is in eastern Democratic Republic of the Congo, stretching along the borders with Uganda and Rwanda across North Kivu and nearby areas.",
    "visitorExperience": "When authorities permit tourism, activities have included guided gorilla trekking, volcano hikes and visits to selected landscapes. Activities are not continuously available. Armed conflict can make access unsafe or suspended; consult current park notices and official travel advice before considering a visit."
  },
  "Kahuzi-Biega National Park": {
    "history": "Kahuzi-Biega was established to protect montane and lowland forests in the Albertine Rift. Conservation has focused particularly on the eastern lowland gorilla, while the park has also been affected by conflict, illegal resource extraction and pressure on surrounding communities.",
    "significance": "The park protects one of the most important habitats for eastern lowland gorillas and supports rich forest biodiversity, including endemic species and a transition between montane and lowland forest.",
    "locationDetail": "It lies in South Kivu Province in eastern Democratic Republic of the Congo, west and northwest of Bukavu. It includes the extinct volcanic mountains Kahuzi and Biega as well as lowland forest areas.",
    "visitorExperience": "Where tourism is authorised and safe, guided forest treks may allow visitors to observe habituated eastern lowland gorillas and learn about forest ecology. Access may be restricted or suspended due to security and conservation conditions. Check official park updates before travel."
  },
  "Loango National Park": {
    "history": "Loango became a protected area as Gabon developed its national park system in 2002. Its coastal landscape preserves habitats used by forest and marine wildlife and reflects long-standing relationships between communities, lagoons, fishing grounds and the Atlantic shore.",
    "significance": "The park is notable for the meeting of rainforest, savanna, lagoons and ocean beaches. It is known for wildlife using coastal habitats, including forest elephants, hippos, marine turtles and diverse birdlife.",
    "locationDetail": "Loango lies on Gabon's western Atlantic coast, mainly in Ogooué-Maritime Province, south of Port-Gentil and around lagoons and coastal waterways.",
    "visitorExperience": "Visitors commonly explore by boat, guided walks, beach drives or wildlife observation. Sightings are never guaranteed; the park's appeal is its combination of coast, forest and water. Access often requires advance arrangements because distances and logistics are challenging."
  },
  "Lopé National Park": {
    "history": "Lopé contains evidence of long human occupation, including archaeological traces of ancient communities and later Iron Age settlement. Its landscape combines remnant rainforest with savanna shaped by climate history and human activity over thousands of years.",
    "significance": "The park is important for biodiversity and for understanding the interaction between Central African rainforest and savanna ecosystems. Archaeological and rock-art evidence gives it both natural and cultural significance.",
    "locationDetail": "Lopé National Park is in central Gabon, around the Ogooué River and Lopé railway station, within the central interior.",
    "visitorExperience": "Visitors can take guided wildlife drives, walks and river excursions, with opportunities to see forest elephants, mandrills and other species depending on season. Archaeological and landscape interpretation can be arranged locally. Activities should be planned ahead."
  },
  "Rock-Hewn Churches of Lalibela": {
    "history": "The eleven medieval churches were excavated and carved from living rock, mainly during the twelfth and thirteenth centuries. Ethiopian tradition associates the building programme with King Lalibela, who sought to create a sacred landscape representing a 'New Jerusalem'. The churches remain places of worship and pilgrimage.",
    "significance": "Lalibela is one of the most important centres of Ethiopian Orthodox Christianity and a remarkable achievement of medieval engineering, architecture and devotion. Its churches, trenches, tunnels and ceremonial spaces form an integrated sacred landscape.",
    "locationDetail": "The churches are in Lalibela in Ethiopia's Amhara highlands, at roughly 2,500 metres above sea level and northwest of Addis Ababa.",
    "visitorExperience": "Visitors move between groups of rock-hewn churches through pathways, trenches and tunnels, often with a local guide. Worship continues, so visitors may encounter services and pilgrims. Dress modestly, remove shoes where requested and follow rules around photography and ceremonies."
  },
  "Aksum Archaeological Site": {
    "history": "Aksum was the centre of a major ancient kingdom that flourished from the first centuries CE, with roots earlier in the first millennium BCE. It controlled inland and Red Sea routes, issued coins, built monumental stelae and maintained links with Arabia and the Mediterranean.",
    "significance": "The site records the achievements of one of Africa's major ancient states. Its obelisks, royal tombs, inscriptions and palace remains illuminate early urbanism, long-distance trade and the development of Christianity in the Horn of Africa.",
    "locationDetail": "Aksum lies in northern Ethiopia's Tigray region, near the Eritrean border. Archaeological features are distributed around the modern town and include the Stelae Park, tombs and palace remains.",
    "visitorExperience": "Visitors can view the great stelae, royal tombs, archaeological remains and local museums or churches where access permits. A guide helps explain inscriptions and historical periods. Confirm local security and site arrangements before travel."
  },
  "Harar Jugol": {
    "history": "Harar developed as a walled Islamic city and regional trading centre, with origins extending back many centuries. Its walls, gates, mosques, shrines and merchant houses reflect interactions among Harari, Oromo, Somali, Afar and other communities and links to Red Sea and inland trade routes.",
    "significance": "Harar is one of the Horn of Africa's important historic Islamic cities and a centre of Harari language, scholarship, architecture and craft traditions. Its dense urban form and living religious institutions distinguish it from an abandoned archaeological site.",
    "locationDetail": "Harar Jugol is in eastern Ethiopia, east of Dire Dawa in the Hararghe region. The historic walled city is surrounded by modern Harar.",
    "visitorExperience": "Visitors can walk through old gates and narrow lanes, see traditional houses, markets, mosques and shrines, and learn about local coffee and craft traditions. The hyena-feeding practice is a specific local attraction and should be approached only through responsible operators."
  },
  "Archaeological Sites of the Island of Meroe": {
    "history": "Meroë was a major political and royal centre of the Kingdom of Kush, especially during the later Napatan and Meroitic periods. The area contains royal cemeteries, temples and city remains associated with rulers who governed the Nile corridor and maintained trade links across northeast Africa.",
    "significance": "The pyramids and temples demonstrate distinctive Kushite achievements, including royal burial traditions, monumental architecture and the Meroitic writing system. The site is vital for understanding Nubian history beyond the monuments of Egypt.",
    "locationDetail": "The archaeological landscape lies east of the Nile between Shendi and Atbara in Sudan. It includes royal cemeteries at Meroë and nearby sites such as Naqa and Musawwarat es-Sufra.",
    "visitorExperience": "Where safe and accessible, visits can include pyramid fields, temple reliefs and desert landscapes. The sites are exposed and spread over a large area, so transport, water and a local guide are important. Sudan's security and access situation must be checked before travel."
  },
  "Asmara: Modernist African City": {
    "history": "Asmara grew from highland settlements into a colonial administrative centre in the late nineteenth century. Under Italian rule, especially after 1935, planners built a notable collection of rationalist, futurist and modernist public and commercial buildings alongside older neighbourhoods.",
    "significance": "Asmara is an unusually intact example of twentieth-century modernist urban planning in Africa. Its buildings show how international architectural movements were adapted within an African city and how colonial history shaped urban life.",
    "locationDetail": "Asmara is Eritrea's capital, on a high plateau more than 2,000 metres above sea level. The heritage area includes planned central districts and older local neighbourhoods.",
    "visitorExperience": "Visitors can explore on foot to see cinemas, churches, mosques, synagogues, civic buildings, markets and residential streets from different periods. The experience is architectural and urban rather than focused on a single monument. Follow local photography and travel rules."
  },
  "Lake Assal": {
    "history": "Lake Assal occupies a tectonic depression in the Afar region, where the African and Arabian plates are moving apart. Evaporation in the hot, arid basin leaves extensive salt deposits that local communities have collected and traded for generations.",
    "significance": "It is among the world's lowest-lying land surfaces and one of its most saline lakes. Its geology provides a striking example of active rifting, salt formation and the extreme environments of the Afar Triangle.",
    "locationDetail": "Lake Assal lies in central-western Djibouti within the Danakil Depression, west of the Gulf of Tadjoura and southwest of Djibouti City.",
    "visitorExperience": "Visitors see salt flats, blue-green water, volcanic landscapes and surrounding escarpments. The setting is extremely hot and remote, so guided transport, sun protection and ample water are essential. Follow local advice around salt crusts and water."
  },
  "Laas Geel Rock Art": {
    "history": "Laas Geel contains painted rock shelters created by pastoral communities thousands of years ago. Images include cattle, people and other figures, often preserved in vivid colours because the shelters are protected from much weathering.",
    "significance": "The paintings are among the Horn of Africa's most important prehistoric art discoveries. They provide evidence of early pastoral life, cattle culture, symbolic expression and long-term human settlement.",
    "locationDetail": "The site is near Hargeisa in the territory administered as Somaliland, at a rocky outcrop where seasonal watercourses meet. Visits are usually organised from Hargeisa.",
    "visitorExperience": "Visitors walk among rock shelters with a local guide and may need advance permission or an escort under local rules. Keep a safe distance from the painted surfaces; never touch, wet or mark the art. Confirm current access requirements before travel."
  },
  "Maasai Mara National Reserve": {
    "history": "The Mara landscape has long been used by Maasai pastoral communities and supports wildlife movement across the wider Serengeti-Mara ecosystem. The reserve was established in the twentieth century; its boundaries and management have changed as conservation, tourism and community land arrangements evolved.",
    "significance": "The Mara is known for its large mammal populations and the seasonal movement of wildebeest, zebra and other herbivores. Its conservation depends on connected habitats beyond the reserve and on the relationship between wildlife, tourism and Maasai communities.",
    "locationDetail": "The reserve lies in Narok County in southwestern Kenya, adjoining Tanzania's Serengeti National Park across the international border. The Mara River and open savanna plains are key features.",
    "visitorExperience": "Game drives offer opportunities to observe lions, elephants, giraffes, cheetahs, buffalo and many other species. Migration crossings are seasonal and never guaranteed. Visitors usually stay in licensed camps or lodges and should choose operators who respect wildlife distances and community conservation."
  },
  "Lamu Old Town": {
    "history": "Lamu developed as a Swahili settlement connected to Indian Ocean commerce, with evidence of long-standing trade and cultural exchange along the East African coast. Its urban fabric reflects African, Arab, Persian, Indian and later European influences, while Islamic scholarship and maritime life shaped local institutions.",
    "significance": "Lamu is one of the best-preserved Swahili towns and a living record of coastal urban culture. Its carved doors, coral-stone houses, mosques, courtyards and street pattern show how architecture adapted to climate, trade and social life.",
    "locationDetail": "The old town occupies Lamu Island off Kenya's northern coast, within the Lamu Archipelago. It is reached by boat from the mainland.",
    "visitorExperience": "Visitors explore narrow pedestrian streets, waterfront spaces, museums, historic houses and craft shops. Donkeys and boats remain important forms of transport, and dhow excursions are common. Modest dress and respect for local Muslim customs are important."
  },
  "Serengeti National Park": {
    "history": "The Serengeti ecosystem has supported pastoral and wildlife movement for millennia. The national park was established in 1951 after conservation boundaries changed during the colonial period; the removal of Maasai communities from parts of the park is also part of its modern history.",
    "significance": "The park protects one of the world's most extensive savanna ecosystems. The annual movement of wildebeest, zebra and gazelles, together with large predator populations, makes it important for ecology, migration research and conservation.",
    "locationDetail": "Serengeti National Park is in northern Tanzania, extending west and north from the Ngorongoro area toward the Kenyan border. It forms one connected ecosystem with Kenya's Maasai Mara.",
    "visitorExperience": "Visitors explore by guided 4x4 game drives across plains, river corridors and woodland. Wildlife viewing changes by season and location; migration herds move in response to rainfall, so sightings cannot be guaranteed. Follow park rules and use licensed guides."
  },
  "Ngorongoro Conservation Area": {
    "history": "The Ngorongoro highlands and crater have a long history of human occupation, pastoralism and wildlife. The conservation area was established in 1959 as a multiple-use landscape intended to conserve wildlife while accommodating pastoral communities; the relationship between conservation policy and residents has changed and been contested.",
    "significance": "The crater is a major volcanic caldera with exceptional wildlife concentrations, while the wider area includes Olduvai Gorge and important pastoral landscapes. It brings together natural history, human evolution research and contemporary conservation questions.",
    "locationDetail": "The area lies in Tanzania's Arusha Region west of Arusha and northwest of Lake Manyara. The crater, highlands and Olduvai Gorge are within the wider landscape.",
    "visitorExperience": "Visitors can descend into the crater on authorised safari routes and combine the trip with archaeological or cultural visits where permitted. Vehicle access is regulated and time-limited. Conditions can be cold on the rim and warm below; respect conservation rules and resident communities."
  },
  "Stone Town of Zanzibar": {
    "history": "Stone Town grew from earlier Swahili settlements into a major Indian Ocean port, especially during the nineteenth century under the Omani sultanate. Its buildings reflect trade and cultural links among African, Arab, Indian and European communities, including the history of slavery and the spice economy.",
    "significance": "The town is a key example of Swahili coastal urban culture and the layered history of the western Indian Ocean. Its houses, mosques, churches, markets and waterfront show how commerce, religion and migration shaped a distinctive urban society.",
    "locationDetail": "Stone Town forms the historic core of Zanzibar City on Unguja Island, part of Tanzania's Zanzibar archipelago. It faces the harbour along the island's western coast.",
    "visitorExperience": "Visitors walk through narrow lanes, markets and waterfront streets, visit selected historic houses and museums and see the Old Fort and former sultanate buildings. Guided walks help explain architecture and the history of slavery and trade. Respect residents and dress appropriately near religious spaces."
  },
  "Mount Kilimanjaro": {
    "history": "Kilimanjaro is a volcanic massif with three main cones: Kibo, Mawenzi and Shira. Scientists and climbers have visited the mountain for generations; the first recorded successful summit ascent was made in 1889 by Hans Meyer and Ludwig Purtscheller with local guides and porters.",
    "significance": "At 5,895 metres, Uhuru Peak on Kibo is the highest point in Africa. The mountain is important for its ecological zones, endemic species, water catchments and cultural meaning to Chagga communities living on its slopes.",
    "locationDetail": "Kilimanjaro National Park is in northeastern Tanzania near the Kenyan border, with principal climbing routes beginning in the Moshi region.",
    "visitorExperience": "Most visitors undertake a multi-day guided climb through rainforest, moorland, alpine desert and summit zones. Climbing is demanding and altitude illness is a serious risk; proper acclimatisation, a licensed operator and guide advice are essential. Not all climbers reach the summit."
  },
  "Bwindi Impenetrable National Park": {
    "history": "Bwindi's forest is a long-surviving refuge of Afromontane biodiversity. It became a protected forest reserve before being designated a national park in 1991, with conservation efforts focused on mountain gorillas and the wider ecosystem.",
    "significance": "The park protects one of the most important habitats for endangered mountain gorillas and many other species, including birds, butterflies, plants and forest mammals. It is a major conservation landscape within the Albertine Rift.",
    "locationDetail": "Bwindi lies in southwestern Uganda along the edge of the Albertine Rift, close to the borders with the Democratic Republic of the Congo and Rwanda. Several trailhead sectors serve different habituated gorilla groups.",
    "visitorExperience": "Gorilla trekking involves walking through dense, steep forest with trained rangers and trackers. Permits are limited, trekking duration varies and sightings are not guaranteed. Visitors must follow health, distance and group-size rules to protect gorillas and people."
  },
  "Murchison Falls National Park": {
    "history": "The park protects a section of the Victoria Nile and surrounding savanna and woodland. The falls became known to nineteenth-century explorers and later visitors, while local communities have long depended on the Nile and adjacent landscapes.",
    "significance": "At Murchison Falls, the Nile is forced through a narrow rock cleft before plunging into a powerful waterfall. The park combines one of Uganda's best-known natural landmarks with important wildlife habitats and river ecosystems.",
    "locationDetail": "The park spans northwestern Uganda around the Victoria Nile, northwest of Kampala and east of Lake Albert.",
    "visitorExperience": "Visitors can take game drives across savanna, boat trips on the Nile toward the base of the falls and hikes to viewpoints above the gorge when permitted. Wildlife sightings vary by season. Arrange activities through authorised park operators and follow ranger guidance."
  },
  "Volcanoes National Park": {
    "history": "The Virunga volcano region has long been important to local communities and to research on mountain ecosystems. The park was established in 1925 as part of the early conservation system in the Belgian Congo and later became central to Rwanda's mountain gorilla conservation programme.",
    "significance": "The park protects volcanic slopes, afro-montane forest and endangered mountain gorillas. It is also associated with research and conservation work that advanced understanding of gorilla ecology and protection.",
    "locationDetail": "Volcanoes National Park is in northwestern Rwanda, within the Virunga Mountains along the borders with Uganda and the Democratic Republic of the Congo.",
    "visitorExperience": "Guided activities can include mountain gorilla trekking, golden monkey tracking and volcano hikes, subject to permits and park rules. Treks take place at altitude through forest and muddy terrain. Visitors need advance permits, suitable clothing and compliance with wildlife health and distance rules."
  },
  "Kigali Genocide Memorial": {
    "history": "The memorial was established at Gisozi to commemorate the 1994 genocide against the Tutsi in Rwanda. It serves as a burial place for victims and a centre for documentation, remembrance and education about the genocide and its history.",
    "significance": "The memorial honours victims, supports survivors' remembrance and preserves evidence for future generations. Its work contributes to education, reflection and efforts to counter genocide denial.",
    "locationDetail": "The memorial is in Gisozi, Kigali, on a hillside overlooking parts of Rwanda's capital.",
    "visitorExperience": "Visitors move through curated exhibitions, personal testimonies, photographs and memorial spaces for quiet reflection. The subject matter is emotionally demanding and may be distressing. Allow time, behave respectfully and follow the memorial's photography and conduct rules."
  },
  "Lake Malawi National Park": {
    "history": "The southern end of Lake Malawi has long supported fishing communities and lakeshore settlements. The national park was established in 1980 to protect part of the lake and its islands, including habitats with exceptionally diverse freshwater fish.",
    "significance": "Lake Malawi contains one of the world's richest freshwater fish assemblages, especially its cichlids, many found nowhere else. The park is important for freshwater biodiversity and lake conservation.",
    "locationDetail": "The park is at the southern end of Lake Malawi, around Cape Maclear and nearby islands in Mangochi District. The lake forms part of the Great Rift Valley system.",
    "visitorExperience": "Visitors may enjoy boat trips, snorkelling, diving, kayaking and shoreline walks where activities are permitted. Clear water and rocky islands are highlights, while fish diversity can be seen underwater. Follow conservation rules and avoid collecting or feeding wildlife."
  },
  "Avenue of the Baobabs": {
    "history": "The avenue is a group of mature Grandidier's baobabs left along a former route through a landscape transformed by agriculture and settlement. The trees are natural rather than planted as a formal avenue, and some are estimated to be hundreds of years old.",
    "significance": "The baobabs are an emblematic feature of western Madagascar and a symbol of the island's distinctive biodiversity. The landscape has become an important focus for local conservation and community tourism.",
    "locationDetail": "The avenue is near Morondava in the Menabe region of western Madagascar, along the dirt road toward Belo-sur-Tsiribihina.",
    "visitorExperience": "Visitors walk or drive slowly among the trees, especially around sunrise or sunset when light highlights their silhouettes. Facilities may be basic because it is an open landscape rather than a built attraction. Avoid damaging roots or bark and respect local land use."
  },
  "Tsingy de Bemaraha": {
    "history": "The tsingy landscape formed as limestone dissolved and fractured over geological time, creating sharp pinnacles, caves, fissures and underground drainage. Surrounding forest and dry woodland support wildlife adapted to this rugged terrain.",
    "significance": "The reserve protects an unusual karst ecosystem and many endemic species, including lemurs, birds and reptiles. Its geological formations are among Madagascar's most distinctive natural landscapes.",
    "locationDetail": "Tsingy de Bemaraha is in western Madagascar's Melaky Region, inland from the coast and generally approached via Bekopaka.",
    "visitorExperience": "Guided hikes can include limestone formations, suspension bridges, ladders and narrow passages, depending on the circuit. Some routes require fitness, careful footing and comfort with heights. Access is seasonal and transport challenging, so arrange guides and check route conditions."
  },
  "Vallée de Mai Nature Reserve": {
    "history": "The palm forest on Praslin is a remnant of a distinctive Seychelles ecosystem. It became protected to conserve the native coco de mer palm and the wider network of endemic plants and animals that depend on the forest.",
    "significance": "The reserve is globally recognised for the coco de mer, whose large seed is unique to the Seychelles, and for its relatively intact palm forest. It is a key site for island biodiversity and ecological research.",
    "locationDetail": "Vallée de Mai is on Praslin Island in the Seychelles, in the central interior of the island.",
    "visitorExperience": "Visitors follow marked trails beneath towering palms, with interpretive information about the coco de mer and endemic species. Guided walks can help identify birds, geckos and plants. Stay on paths and do not remove seeds, plants or wildlife."
  },
  "Anse Source d'Argent": {
    "history": "Anse Source d'Argent is a natural coastal landscape shaped by granite geology, waves and tropical vegetation. It became widely known through photography and tourism, but remains part of the lived landscape of La Digue.",
    "significance": "Its granite boulders, shallow lagoon and coastal vegetation make it one of the Seychelles' most recognisable beaches. It illustrates the scenic value of the granitic islands and the need to manage tourism in fragile coastal environments.",
    "locationDetail": "The beach is on the southwestern coast of La Digue Island in the Seychelles. Access commonly passes through the L'Union Estate area, subject to local entry arrangements.",
    "visitorExperience": "Visitors enjoy sheltered shallows, swimming where conditions permit, photography and walks between granite formations. Tides, currents and weather affect water conditions; rocks can be slippery. Use designated paths and avoid damage to coral or vegetation."
  },
  "Le Morne Cultural Landscape": {
    "history": "Le Morne Brabant became a place of refuge for enslaved people who escaped plantations during the colonial period. Oral traditions associate the mountain with maroons who lived in caves and difficult-to-reach slopes; details of individual events vary in historical accounts.",
    "significance": "The mountain is a powerful symbol of resistance to slavery, freedom and the memory of maroon communities in Mauritius and the wider Indian Ocean. Its cultural meaning is inseparable from the natural landscape and the history of forced labour.",
    "locationDetail": "Le Morne Brabant rises on the southwestern tip of Mauritius, overlooking the Indian Ocean and the peninsula around Le Morne village.",
    "visitorExperience": "Visitors can appreciate the landscape from coastal viewpoints and, where authorised, join guided hikes on designated routes. The upper climb is steep and exposed, and some sections require a guide or permission. Approach the site respectfully as a place of remembrance."
  },
  "Okavango Delta": {
    "history": "The Okavango Delta is an inland river delta formed where the Okavango River spreads into the Kalahari sands rather than reaching the sea. Seasonal flooding has shaped settlement, fishing, pastoral activity and wildlife movement for centuries.",
    "significance": "The delta is one of the world's largest inland wetland systems and a major refuge for African wildlife. Its channels, floodplains, islands and dry woodland support exceptional biodiversity and are internationally important for wetland conservation.",
    "locationDetail": "It lies in northwestern Botswana, with wetlands spreading around Maun toward the Moremi region.",
    "visitorExperience": "Visitors explore by mokoro canoe where water levels allow, motorboat, guided walking activity and safari vehicle in suitable areas. Wildlife may include elephants, hippos, crocodiles and antelope, though sightings depend on season. Choose low-impact operators who respect local community protocols."
  },
  "Chobe National Park": {
    "history": "Chobe became Botswana's first national park in 1967, protecting a broad riverine and woodland landscape. The area has long supported wildlife and human communities, while conservation and tourism developed around the Chobe River.",
    "significance": "The park is famous for large elephant populations and its role in conserving wildlife across northern Botswana. River, floodplain and woodland habitats support diverse mammals and birds.",
    "locationDetail": "Chobe is in northern Botswana near Kasane, close to the borders with Namibia, Zambia and Zimbabwe. The Chobe Riverfront is its best-known visitor area.",
    "visitorExperience": "Boat cruises offer views of elephants, hippos, crocodiles and waterbirds, while game drives explore woodland and floodplain habitats. Wildlife activity varies by season and time of day. Use licensed guides and keep safe distances from animals."
  },
  "Sossusvlei and Deadvlei": {
    "history": "The dunes formed through long-term wind transport and deposition of sand, while Deadvlei developed as a clay pan after water once reached the area and camelthorn trees later died when the river changed course. The dry climate preserved their dark remains.",
    "significance": "The landscape is a striking example of an ancient desert environment. Its dunes and fossilised trees reveal the interaction of wind, water and extreme aridity and define part of Namibia's natural heritage.",
    "locationDetail": "Sossusvlei and Deadvlei are within Namib-Naukluft National Park in southwestern Namibia, accessed through the Sesriem gate.",
    "visitorExperience": "Visitors travel through the dune corridor, climb selected dunes and walk across the clay pan to view the dead trees. Sand, distance and heat make early starts, water and suitable footwear important. Final access may require a shuttle or 4x4."
  },
  "Etosha National Park": {
    "history": "Etosha was established as a protected area in 1907 during German colonial rule and later underwent major changes in size and management. Its central salt pan and surrounding savanna, woodland and waterholes have long shaped wildlife movement across northern Namibia.",
    "significance": "Etosha protects important dryland ecosystems and wildlife populations, including elephants, lions, rhinos and antelope. Its waterholes provide opportunities to observe how animals adapt to arid conditions.",
    "locationDetail": "The park lies in northern Namibia, centred on Etosha Pan and extending across several regions. Main visitor gates include Andersson, Von Lindequist and King Nehale.",
    "visitorExperience": "Visitors follow marked roads between waterholes and rest camps on self-drive or guided game drives. Wildlife often gathers at water sources, particularly during dry periods, but sightings are not guaranteed. Remain in vehicles except at designated sites and obey park rules."
  },
  "Table Mountain": {
    "history": "Table Mountain is an ancient sandstone massif whose geological layers record very old landscapes. It has long been part of the Cape's cultural geography, known to local Khoekhoe communities and later European sailors, and became a defining landmark in Cape Town's development.",
    "significance": "The mountain is central to a globally important fynbos biodiversity region, with many plant species found nowhere else. It has major cultural, recreational and scenic significance and forms part of Table Mountain National Park.",
    "locationDetail": "It overlooks Cape Town in South Africa's Western Cape, extending from Signal Hill through the central massif to the Cape Peninsula.",
    "visitorExperience": "Visitors can take the cableway when operating or hike designated trails to the summit and viewpoints. The plateau offers views of the city, Atlantic Ocean and surrounding mountains. Weather changes rapidly, and cableway operations can be affected by wind."
  },
  "Robben Island": {
    "history": "Robben Island was used at different times as a leper colony, military outpost and prison. During apartheid it became a place of political imprisonment, including the long incarceration of Nelson Mandela and other anti-apartheid activists; it later became a museum and memorial.",
    "significance": "The island is a powerful symbol of resistance to apartheid and the pursuit of democracy in South Africa. Its prison spaces, quarries and buildings preserve the lived history of political prisoners.",
    "locationDetail": "It lies in Table Bay, northwest of central Cape Town. Ferries depart from the V&A Waterfront when weather and operations permit.",
    "visitorExperience": "The visit usually combines a ferry crossing, a guided bus tour and a tour of the former prison, sometimes led by a former political prisoner. The experience includes personal testimony and places of confinement. Ferry operations depend on sea and weather conditions."
  },
  "Kruger National Park": {
    "history": "The reserve began as the Sabie Game Reserve in 1898 and became Kruger National Park in 1926. Its creation was part of a changing conservation history involving state protection, local communities, land policy and wildlife management.",
    "significance": "Kruger is one of Africa's largest and best-known protected savanna landscapes. It supports abundant mammals, birds and plant life and is important for ecological research, conservation and tourism in South Africa.",
    "locationDetail": "The park stretches across Limpopo and Mpumalanga provinces in northeastern South Africa, alongside the borders with Mozambique and Zimbabwe.",
    "visitorExperience": "Visitors can self-drive or join guided game drives from rest camps and private concessions. Roads, hides and waterholes offer opportunities to observe wildlife, but sightings vary. Stay within speed limits, remain in vehicles except at authorised places and follow park safety rules."
  },
  "Cradle of Humankind": {
    "history": "The region's limestone caves have preserved hominin fossils and archaeological evidence spanning millions of years. Discoveries at Sterkfontein, Swartkrans and Kromdraai have contributed important specimens and debates to research on human evolution.",
    "significance": "The landscape is one of the world's most important palaeoanthropological regions, providing evidence about early hominins, changing environments and human ancestry. Its importance comes from a network of fossil sites rather than a single cave.",
    "locationDetail": "The Cradle of Humankind lies northwest of Johannesburg and west of Pretoria in Gauteng Province, centred around the Sterkfontein and Maropeng area.",
    "visitorExperience": "Visitors can explore the Maropeng visitor centre and, when open, selected cave tours and interpretation sites. Exhibitions explain fossil discoveries, geology and human evolution. Cave access and conservation work can change, so check current operating information."
  },
  "Victoria Falls (Mosi-oa-Tunya)": {
    "history": "The falls formed as the Zambezi River cut through basalt along geological fractures, creating a deep gorge and successive cataracts. Local communities have long known them as Mosi-oa-Tunya, 'The Smoke That Thunders'; David Livingstone publicised them internationally in the nineteenth century.",
    "significance": "Victoria Falls is one of the world's most spectacular waterfalls and a major natural landmark shared by Zambia and Zimbabwe. The spray, gorge, rainforest and river ecosystem create a distinctive natural environment and tourism destination.",
    "locationDetail": "The falls are on the Zambezi River between Zambia's Southern Province and Zimbabwe's Matabeleland North, near Livingstone and Victoria Falls towns.",
    "visitorExperience": "Visitors explore viewpoints on either side, walk through the spray forest when water levels permit, take river cruises or book helicopter flights and rafting when operating. Water volume varies seasonally, paths can be slippery and border-crossing requirements apply when visiting both sides."
  },
  "Great Zimbabwe National Monument": {
    "history": "Great Zimbabwe was a major Shona-speaking urban and political centre built between roughly the eleventh and fifteenth centuries. Its stone enclosures, hilltop complex and valley settlements were created by African communities using dry-stone masonry and connected to gold and other trade through the Swahili coast.",
    "significance": "The monument is a major archaeological site and evidence of precolonial state formation, architecture and long-distance commerce. It also has national symbolic importance and corrects colonial-era claims that its monumental structures were built by outsiders.",
    "locationDetail": "It is in Masvingo Province in southeastern Zimbabwe, around 30 kilometres southeast of Masvingo city.",
    "visitorExperience": "Visitors can walk through the Hill Complex, Great Enclosure and Valley Ruins, viewing stone walls, passages and elevated spaces. Interpretation explains the site's urban layout, craftsmanship and trade. Terrain includes uneven stone surfaces and steps, so sturdy footwear is useful."
  },
  "Hwange National Park": {
    "history": "Hwange began as a protected game reserve in the 1920s and became a national park in 1961. Its landscape has long supported wildlife and human communities, while conservation management has developed around woodland, grassland and seasonal water sources.",
    "significance": "Hwange is Zimbabwe's largest national park and protects broad savanna and woodland habitats. It is especially known for elephants and for waterholes that sustain wildlife during the dry season.",
    "locationDetail": "The park lies in western Zimbabwe near the Botswana border and south of Victoria Falls. Main visitor areas include Hwange and Main Camp.",
    "visitorExperience": "Visitors explore by guided or self-drive game viewing on designated routes, often visiting waterholes where elephants and other animals gather. The dry season can concentrate wildlife, but sightings depend on conditions. Use authorised camps and guides and remain in vehicles outside designated areas."
  },
  "South Luangwa National Park": {
    "history": "South Luangwa protects the Luangwa Valley, where riverine forests, floodplains and woodland have supported wildlife and local communities for generations. Its development in the twentieth century helped establish Zambia as a destination for guided walking safaris.",
    "significance": "The park is celebrated for wildlife and its river ecosystem. It is particularly associated with leopard sightings and walking-safari traditions that emphasise tracking, ecology and close observation.",
    "locationDetail": "South Luangwa is in eastern Zambia along the Luangwa River near Mfuwe and the Muchinga escarpment.",
    "visitorExperience": "Visitors take guided 4x4 game drives, walking safaris and, in some areas and seasons, night drives. Walking safaris have strict safety protocols and are not suitable for everyone. Seasonal roads and camp operations should be checked before travel."
  },
  "Island of Mozambique": {
    "history": "The island developed as a Swahili and Indian Ocean trading settlement before Portuguese occupation in the early sixteenth century. It became a strategic colonial port linking East Africa with routes to India; its buildings record centuries of cultural exchange and colonial administration.",
    "significance": "The island preserves African, Arab, Swahili, Indian and Portuguese influences. Fortifications, religious buildings, coral architecture and the waterfront show the importance of maritime trade and Mozambique's coastal history.",
    "locationDetail": "It lies off Nampula Province in northern Mozambique and is connected to the mainland by a long bridge. Stone Town and Makuti Town form distinct parts of the settlement.",
    "visitorExperience": "Visitors can explore the old fort, palace and museum complex, churches, mosques, waterfront and traditional neighbourhoods, often on foot or by local transport. Guided tours explain the island's layered history and living communities. Plan for tropical heat and limited services."
  },
  "Bazaruto Archipelago": {
    "history": "The Bazaruto islands form a coastal marine environment shaped by coral reefs, seagrass beds, sandbanks and ocean currents. Fishing communities have long used the surrounding waters, while conservation programmes developed to protect marine habitats and threatened species.",
    "significance": "The archipelago is important for dugongs, sea turtles, dolphins, coral reefs and other marine biodiversity. It is one of Mozambique's best-known marine conservation and island-tourism landscapes.",
    "locationDetail": "The islands lie off the coast of Inhambane Province in southeastern Mozambique, east of Vilankulo and the mainland coast.",
    "visitorExperience": "Visitors may take boat trips, snorkel, dive, kayak, sail or enjoy beaches, depending on weather and marine conditions. Wildlife encounters are never guaranteed; responsible operators maintain distance from animals and reefs. Follow local skipper and park guidance."
  },
  "Maletsunyane Falls": {
    "history": "The Maletsunyane River drops from the Lesotho highlands into a deep basalt gorge, creating the falls. The landscape has long been part of the mountain environment around Semonkong, where settlement and travel are shaped by steep valleys and high-altitude weather.",
    "significance": "The waterfall is among southern Africa's highest single-drop falls and a distinctive feature of Lesotho's mountainous interior. It is valued for its dramatic geology, scenic setting and role in adventure tourism.",
    "locationDetail": "Maletsunyane Falls is near Semonkong in Maseru District, central Lesotho, within the highland region south of Maseru.",
    "visitorExperience": "Visitors can view the falls from viewpoints or arrange guided hikes and adventure activities in the gorge area. Conditions depend on weather and steep terrain; some routes require a guide and good fitness. Use authorised operators and avoid unstable cliff edges."
  },
  "Mantenga Cultural Village and Nature Reserve": {
    "history": "Mantenga was developed as a heritage and nature attraction to present aspects of Swazi homestead life, cultural performance and the environment of the Ezulwini Valley. Its programme interprets traditions that remain part of contemporary Eswatini rather than claiming to represent every community.",
    "significance": "The site offers an introduction to Swazi architecture, household practices, dance and cultural expression alongside a natural setting. It connects cultural interpretation with landscape conservation and local tourism.",
    "locationDetail": "Mantenga is in the Ezulwini Valley in central Eswatini, near Lobamba and the Mdzimba hills.",
    "visitorExperience": "Visitors may join guided village presentations, see traditional dance performances and walk to the waterfall and nature areas, subject to operating arrangements. Demonstrations are interpretive encounters; listen to guides and respect performers and local customs."
  }
};

const topic = (title: string, description: string, questions: string[]): Topic => ({ title, description, questions });
const cultureTopic = (country: string, community: string, history: string, wayOfLife: string, traditions: string, music: string): Topic => ({
  title: `${country}: ${community}`,
  description: `Explore the ${community} community in ${country}, including its history, everyday life, traditions and music.`,
  questions: [
    `How has the history of the ${community} community shaped its identity?`,
    "How do geography, work, family and community life shape everyday practices?",
    "Which ceremonies, festivals, crafts, foods and oral traditions are important?",
    "Which musical styles, instruments, songs and dances are associated with the community?"
  ],
  culture: { community, history, wayOfLife, traditions, music }
});
const festivalTopic = (title: string, origin: string, meaning: string, celebration: string, location: string): Topic => {
  const detail = FESTIVAL_PROFILE_CONTEXT[title];
  return {
    title,
    description: "Discover the origins, cultural meaning and celebration of " + title + ", including where the event takes place.",
    questions: [],
    festival: {
      origin: [origin, detail?.[0]].filter(Boolean).join("\n\n"),
      meaning: [meaning, detail?.[1]].filter(Boolean).join("\n\n"),
      celebration: [celebration, detail?.[2]].filter(Boolean).join("\n\n"),
      location: [location, detail?.[3]].filter(Boolean).join("\n\n")
    }
  };
};

const kingdomTopic = (title: string, country: string, period: string, overview: string, legacy: string): Topic => ({
  title,
  description: country + " · " + period,
  questions: [],
  kingdom: { country, period, overview, legacy, context: KINGDOM_PROFILE_CONTEXT[title] || "" }
});

const touristSiteTopic = (title: string, country: string, location: string, siteType: string, overview: string): Topic => {
  const detail = TOURIST_SITE_PROFILE_DETAILS[title] || { history: "", significance: "", locationDetail: "", visitorExperience: "" };
  return {
    title,
    description: country + " · " + location,
    questions: [],
    touristSite: {
      country, location, siteType, overview,
      history: detail.history,
      significance: detail.significance,
      locationDetail: detail.locationDetail,
      visitorExperience: detail.visitorExperience
    }
  };
};

const categories: Category[] = [
  {
    slug: "date-and-incidents", title: "Date & Incidents", icon: Globe2,
    summary: "Discover African and international events, incidents and historical milestones by date.",
    purpose: "Explore the events, incidents and historical milestones recorded on a particular day. African history receives priority in discovery while events from every world region remain in scope.",
    sections: [],
    sources: [
      { name: "Wikipedia On This Day", scope: "Date-based historical event leads; individual claims should be checked against cited primary and reputable sources", type: "Open historical index", url: "https://en.wikipedia.org/wiki/Wikipedia:On_this_day" },
    ],
  },
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
    product: { label: "Continue to Adesua", href: "https://as.amineva.com", introduction: "When you are ready to continue exploring practical learning and education pathways, visit Adesua." },
  },
  {
    slug: "culture-and-tradition", title: "Culture and Tradition", icon: Globe2,
    summary: "Explore African communities and festivals, their histories, traditions, meanings and celebrations.",
    purpose: "Begin with one cultural community in each of Africa's 54 countries. These profiles are introductions, not claims that one group represents an entire country. Communities are diverse, histories overlap and traditions continue to change.",
    sections: [
      {
        title: "African communities by country",
        description: "Choose a country to explore one of its cultural communities.",
        items: [
          cultureTopic("Algeria", "Kabyle (Amazigh)", "The Kabyle are an Amazigh people rooted in the mountainous Kabylia region. Their history includes village communities, resistance to outside rule and modern campaigns for Amazigh language recognition.", "Mountain villages have combined olive and fig growing, small-scale farming, crafts and trade. Family networks and village associations remain influential alongside urban life and migration.", "Oral poetry, proverbs, weaving, pottery and jewellery are important cultural expressions. Yennayer, the Amazigh new year, is observed in many communities.", "Kabyle music is known for poetic song and strong vocal performance. Contemporary singers have carried Kabyle-language music across Algeria and the diaspora."),
          cultureTopic("Angola", "Ovimbundu", "The Ovimbundu are historically associated with Angola's central highlands. Their kingdoms and trading networks played an important role in regional commerce before and during colonial rule.", "Farming, market exchange and extended family networks are important. Maize and other crops are grown in the highlands, while urbanisation and migration have broadened livelihoods.", "Community ceremonies, marriage customs, oral histories and crafts remain important. Christian and local spiritual practices both influence contemporary life.", "Vocal music, drums and communal dance accompany celebrations. Modern Angolan popular music draws on many regional traditions."),
          cultureTopic("Benin", "Fon", "The Fon are associated with the historic Kingdom of Dahomey, centred in southern Benin. The kingdom developed complex royal institutions before French conquest in the nineteenth century.", "Farming, fishing, markets, crafts and family enterprise shape both rural and urban life.", "Vodun is an important religious and cultural tradition in parts of Benin. Royal history, festivals, storytelling and craft traditions are also influential.", "Drumming, call-and-response singing and dance are central to ceremonies and public celebrations. Performance forms are shared across neighbouring communities."),
          cultureTopic("Botswana", "Tswana", "Tswana-speaking communities developed chiefdoms and political institutions across southern Africa. Their history includes trade, missionary activity, colonial expansion and Botswana's independence.", "Cattle keeping and agriculture have historical importance, alongside trade, wage employment and urban life. The kgotla remains a forum for community discussion in many villages.", "Setswana language, praise poetry, basketry, family ceremonies and the kgotla tradition are important cultural features.", "Setapa and other dances use rhythmic footwork, clapping, singing and drums. Contemporary Tswana music blends older forms with gospel and popular styles."),
          cultureTopic("Burkina Faso", "Mossi", "The Mossi kingdoms of Ouagadougou, Tenkodogo and Yatenga shaped much of the region's political history. The Mogho Naba remains an important symbol of traditional authority.", "Farming and livestock keeping remain important, alongside trade, crafts, public service and migration. Extended-family networks are influential.", "Traditional authority, family ceremonies, oral histories, weaving, pottery and community festivals remain visible. Nabasga ceremonies renew relationships between chiefs and their people in some communities.", "Warba and other Mossi dances combine drums, singing and energetic movement. Praise songs accompany festivals and public ceremonies."),
          cultureTopic("Burundi", "Hutu communities", "Hutu communities form Burundi's largest population group. Their history is intertwined with Tutsi and Twa communities through the kingdom, colonial rule, independence and later political violence.", "Agriculture has been central to many rural livelihoods. Family and neighbourhood networks, coffee production, education and urban employment shape contemporary life.", "Kirundi language and many ceremonies and social practices are shared across Hutu, Tutsi and Twa communities. Customs vary by region and family.", "Burundi's royal drum tradition is a major national heritage shared beyond one ethnic group. Drumming, dance and communal performance remain significant."),
          cultureTopic("Cabo Verde", "Kriolu-speaking Creole communities", "Cabo Verde's Creole society developed through encounters between West African peoples and Portuguese colonial settlement on Atlantic islands from the fifteenth century.", "Island life has been shaped by the sea, dry conditions, fishing, farming, maritime work and migration. Family ties across islands and the diaspora are important.", "Kriolu language, family gatherings, local festivals and food traditions are central to cultural life. Customs vary across the islands.", "Morna, coladeira, funaná and batuque are well-known forms expressing longing, migration, love and island identity."),
          cultureTopic("Cameroon", "Bamileke", "Bamileke communities are associated with the western Grassfields. Their history includes a network of chiefdoms with established palace institutions, artistic traditions and complex political organisation.", "Farming, commerce, craftsmanship and migration are important. Family and hometown associations connect rural communities with Cameroon's cities and the diaspora.", "Chiefdom ceremonies, carved objects, royal regalia, beadwork, woven cloth and festivals are well-known. Each chiefdom has its own customs.", "Drums, xylophones, horns and group dance accompany palace ceremonies and public celebrations. Performance varies between chiefdoms."),
          cultureTopic("Central African Republic", "Gbaya", "The Gbaya are among the major communities of the Central African Republic, with related populations in Cameroon. Their history reflects movement across savanna and forest zones, trade and colonial disruption.", "Farming, hunting, fishing and forest resource use have supported many rural communities. Family networks and local markets remain important.", "Oral history, community ceremonies, craft practices and knowledge of the forest and agricultural seasons contribute to cultural identity.", "Communal singing, drums, rattles and dance accompany ceremonies and celebrations. Songs can carry historical memory and social commentary."),
          cultureTopic("Chad", "Sara", "Sara communities are concentrated in southern Chad and include several related peoples and languages. Their history is connected to the Logone and Chari river regions, trade and changing states of the Lake Chad basin.", "Rain-fed farming, fishing and livestock keeping are important in many areas. Family compounds and village networks support daily life.", "Initiation, age-related ceremonies, oral histories, dance and craft traditions vary among Sara communities and have changed over time.", "Drums, flutes, xylophones and group singing accompany dance and ceremonies. Sara musical forms are part of the diverse soundscape of southern Chad."),
          cultureTopic("Comoros", "Shingazidja communities (Grande Comore)", "Shingazidja refers to the Comorian language and cultural community of Grande Comore. Comorian society reflects centuries of African, Arab, Persian and wider Indian Ocean connections.", "Village life, farming, fishing, trade and strong extended-family ties are important. Migration links families with Madagascar, East Africa, France and other islands.", "The grand marriage, or Anda, is a major social institution in parts of Grande Comore. Islamic practice and island customs are closely interwoven.", "Twarab, influenced by East African and Indian Ocean traditions, is important at weddings and celebrations. Drumming and dance vary across the islands."),
          cultureTopic("Republic of the Congo", "Kongo (Bakongo)", "Kongo-speaking peoples are connected to the historic Kingdom of Kongo around the lower Congo River. Its history includes diplomacy, Christianity, trade and resistance to colonial expansion.", "Farming, fishing, trading and urban livelihoods are important. Kinship and local associations connect communities across the Congo River region.", "Oral histories, family ceremonies, carving, raffia arts and spiritual traditions are part of Kongo heritage. Local practices vary.", "Drums, lamellophones, call-and-response singing and dance accompany social and ceremonial life. Congolese rumba draws on wider regional influences."),
          cultureTopic("Democratic Republic of the Congo", "Luba", "Luba communities are associated with historic kingdoms of the central and southeastern Congo basin, with influential systems of kingship, trade and oral history.", "Farming, fishing, craft work and trade have long supported communities. Contemporary Luba life spans rural villages and large cities.", "Luba heritage includes oral historians, sculptural arts, royal memory and the lukasa memory board used by trained practitioners to recall historical knowledge.", "Drumming, xylophones, lamellophones, dance and praise singing feature in community performances. Modern Congolese music is a major contemporary expression."),
          cultureTopic("Côte d'Ivoire", "Baoulé (Akan)", "The Baoulé are an Akan-speaking people of central Côte d'Ivoire. Oral histories connect their polity to migration from the Asante area in the eighteenth century and the figure of Queen Abla Pokou.", "Agriculture, including cocoa and food crops, trading and craft work are important. Family and lineage networks shape rural and urban life.", "Weaving, wood carving, goldwork, masks and ceremonies mark family and community events. Goli masquerade performances are among the recognised forms.", "Drumming, dance and ensemble performance accompany festivals and ceremonies, within the wider Akan and Ivorian musical landscape."),
          cultureTopic("Djibouti", "Afar", "The Afar are a Cushitic-speaking people of the Horn of Africa whose communities extend across Djibouti, Eritrea and Ethiopia. Their history is linked to Red Sea routes and salt trade.", "Pastoralism has traditionally been central, with camel, goat and sheep herding adapted to arid conditions. Trade, transport, fishing and urban employment also shape livelihoods.", "Afar oral poetry, customary law, hospitality and clan relationships are important. Ceremonies and social customs vary across communities.", "Poetry, rhythmic song, dance and percussion feature in celebrations. Oral performance carries history, praise and social commentary."),
          cultureTopic("Egypt", "Nubian communities", "Nubian communities have deep roots along the Nile in southern Egypt and northern Sudan. Their history includes ancient kingdoms such as Kush and later relocation of many villages after the Aswan High Dam.", "Nubian life has historically been linked to the Nile, farming, fishing, trade and village networks. Many Nubians now live in cities while maintaining ties to ancestral communities.", "Nubian languages, distinctive house decoration, wedding customs, handicrafts and storytelling remain important. Traditions differ among Nubian communities.", "Nubian songs often feature strong rhythm, group response and instruments such as the tanbura and drums. Music is central to weddings and cultural memory."),
          cultureTopic("Equatorial Guinea", "Fang", "The Fang are a major people of mainland Equatorial Guinea and neighbouring Central African states. Their history includes movement through the equatorial forest and clan-based communities.", "Farming, forest knowledge, trade and urban employment are important. Family and clan ties connect rural communities and the capital region.", "Oral histories, ceremonies, carving and knowledge passed between generations contribute to Fang identity. Practices differ across communities.", "The mvet is a celebrated Fang epic storytelling and musical tradition. Drumming, song and dance are also part of social celebrations."),
          cultureTopic("Eritrea", "Tigrinya", "Tigrinya-speaking communities are concentrated in Eritrea's central highlands and extend into northern Ethiopia. Their history includes highland kingdoms, Red Sea connections, colonial rule and the independence struggle.", "Highland farming, livestock keeping, trade and urban work are important. Extended families and village ties remain influential.", "Coffee ceremonies, wedding customs, communal meals and religious festivals are prominent in many communities. Customs vary by faith, region and family.", "The krar lyre, masenqo fiddle, drums and vocal song appear in Tigrinya musical traditions. Contemporary music blends local and global styles."),
          cultureTopic("Eswatini", "emaSwati (Swazi)", "The Swazi nation emerged through Nguni migrations and the consolidation of a kingdom under leaders including Sobhuza I and Mswati II. The monarchy remains central to national ceremony.", "Cattle keeping and farming have historical importance, alongside wage employment, trade and urban life. Extended family relationships remain influential.", "The Umhlanga Reed Dance and Incwala ceremony are major national events. Traditional dress, praise poetry and community ceremonies remain visible.", "Sibhaca dance, group singing, drums and rhythmic clapping accompany ceremonies and celebrations. Gospel and popular music are also widely enjoyed."),
          cultureTopic("Ethiopia", "Oromo", "The Oromo are Ethiopia's largest ethnolinguistic community, with a long history across the Horn of Africa. Oromo history includes the Gadaa system, regional states and movements for recognition and self-government.", "Livelihoods range from pastoralism to mixed farming and urban professions. Cattle, land, markets and extended family networks remain important in many areas.", "The Gadaa system is a well-known age-grade system of governance. Irreecha thanksgiving, oral poetry and customary practices are important, with regional variation.", "Oromo music includes poetic song, dance and instruments such as the krar and traditional drums. Songs express identity, social experience and history."),
          cultureTopic("Gabon", "Fang", "Fang communities are among the largest cultural groups in northern Gabon and also live in neighbouring countries. Their history is connected to movements through the equatorial forest and clan networks.", "Farming, forest-based livelihoods, trade and urban employment are important. Family and clan relationships connect villages with Libreville and other towns.", "Fang heritage includes oral history, carving, mask traditions and the mvet epic cycle. Ceremonial practices differ among communities.", "The mvet is a major Fang epic storytelling and musical tradition. Drums, group singing and dance accompany community gatherings."),
          cultureTopic("The Gambia", "Mandinka", "The Mandinka are part of the wider Mande-speaking peoples whose history includes the Mali Empire and trading networks across West Africa. Mandinka communities have long been established along the Gambia River.", "Rice and other crop farming, fishing, trade and urban livelihoods are important. Family networks and Islamic practice shape social life.", "Griots, known as jali, preserve family histories, praise poetry and oral traditions. Naming ceremonies, weddings and community celebrations are important.", "The kora, a 21-string harp-lute, is strongly associated with Mandinka griot performance. Balafon, drums and praise singing also feature."),
          cultureTopic("Ghana", "Asante (Akan)", "The Asante state grew into a powerful kingdom in the forest region of present-day Ghana, with Kumasi as its capital. The Golden Stool, Asantehene and resistance to British expansion are central to its history.", "Cocoa and food-crop farming, trading, craftsmanship and urban enterprise are important. Matrilineal clan relationships and traditional authority continue to shape cultural life.", "Kente weaving, adinkra symbols, goldwork, Akwasidae observances and oral histories are well-known. Asante culture is part of the wider Akan family.", "Fontomfrom and atumpan drums, kete and adowa dance, praise singing and horn ensembles accompany court and community ceremonies."),
          cultureTopic("Guinea", "Fulani (Fula or Peul)", "Fulani communities are widespread across West Africa and have a major presence in Guinea's Fouta Djallon highlands. Their history includes pastoral networks, Islamic scholarship and the Imamate of Futa Jallon.", "Cattle herding has been important alongside farming, trade, teaching and professional work. Family networks and Fulfulde connect communities across the region.", "Pulaaku is often used for Fulani ethical and social ideals, though its meaning varies. Poetry, dress, weddings and Islamic learning are important cultural expressions.", "Fulani music includes vocal poetry, flute and string instruments, with regional styles such as yela. Songs celebrate beauty, livestock, history and social values."),
          cultureTopic("Guinea-Bissau", "Balanta", "The Balanta are one of Guinea-Bissau's major communities, with a history centred largely in coastal and central regions. They played an important role in rural society and the independence struggle.", "Rice cultivation, fishing and community labour have been important. Family and village networks support farming, trade and contemporary livelihoods.", "Harvest gatherings, wrestling, ceremonies marking life stages and oral traditions are important in many communities. Customs differ by locality.", "Drums, group singing, dance and call-and-response accompany festivals and communal work. Kussundé is a recognised Balanta performance tradition."),
          cultureTopic("Kenya", "Kikuyu (Gikuyu)", "The Kikuyu are a major Bantu-speaking community centred around Mount Kenya and the central highlands. Their history includes settlement in the region, the Mau Mau uprising and a prominent role in the independence movement.", "Smallholder farming, trade, professional work and urban enterprise are important. Land, family and clan relationships have shaped social life.", "Oral histories, initiation traditions, marriage ceremonies and community gatherings are important. Practices have evolved and differ between families and generations.", "Kikuyu song and dance use the wandindi fiddle, drums, rattles, horns and flutes. Music accompanies weddings, ceremonies and celebrations."),
          cultureTopic("Lesotho", "Basotho", "The Basotho nation was consolidated in the nineteenth century under Moshoeshoe I during regional upheaval. The mountain kingdom later became a British protectorate before independence in 1966.", "Livestock keeping, farming, textile work, trade and employment in South Africa have shaped livelihoods. Mountain geography and family networks remain important.", "The Basotho blanket, mokorotlo hat, praise poetry and initiation schools are recognised cultural features. Village ceremonies and arts events support cultural expression.", "Famo and other local styles use singing, accordion, drums and dance. Traditional songs and praise poetry remain important at gatherings."),
          cultureTopic("Liberia", "Kpelle", "The Kpelle are one of Liberia's largest communities, concentrated in central and northwestern areas. Their history includes local chiefdoms, farming communities, trade and the formation of modern Liberia.", "Rice farming, cassava cultivation, trade and craft production have long supported livelihoods. Extended families and migration shape contemporary life.", "Poro and Sande are important traditional institutions in some communities, associated with social education and organisation. Practices should be understood locally and respectfully.", "Drums, masks, dance and group singing accompany ceremonies and celebrations. Oral performance communicates community history and social values."),
          cultureTopic("Libya", "Amazigh (Berber)", "Amazigh communities are indigenous to North Africa and have deep roots in Libya's Nafusa Mountains, coastal towns and Saharan areas. Their history includes ancient North African kingdoms and later Arab and Ottoman periods.", "Mountain agriculture, oasis livelihoods, pastoralism, trade and urban professions support different communities. Family and village ties remain important.", "Amazigh languages, weaving, jewellery, food customs and Yennayer are part of cultural heritage. Practices vary among Nafusa, coastal and Saharan communities.", "Group singing, frame drums, flutes and dance accompany weddings and seasonal celebrations. Amazigh musical styles vary across North Africa."),
          cultureTopic("Madagascar", "Merina", "The Merina are associated with Madagascar's central highlands and the Kingdom of Imerina, which expanded under nineteenth-century rulers before French colonisation.", "Rice cultivation, cattle keeping, trade, education and urban professions are important. Family ancestry and ancestral tombs have strong social significance.", "Famadihana, the turning of the bones, is practised by some highland families as a ceremony of remembrance and family connection. Practices vary by family and region.", "The valiha bamboo tube zither is a well-known Malagasy instrument. Hira gasy performance, vocal harmony and dance are important in highland cultural life."),
          cultureTopic("Malawi", "Chewa", "The Chewa are a major Bantu-speaking people of central and southern Africa. Their history includes the Maravi polity and long-standing links across Malawi, Zambia and Mozambique.", "Smallholder farming, fishing, trading and urban employment are important. Matrilineal family and inheritance practices are common in many communities, though customs vary.", "Gule Wamkulu, the masked dance associated with the Nyau society, is a major Chewa tradition recognised by UNESCO. It combines performance, moral teaching and community memory.", "Drums, masks, dance and call-and-response singing are central to Gule Wamkulu and other celebrations."),
          cultureTopic("Mali", "Bambara (Bamana)", "The Bambara, also known as Bamana, are a major Mande-speaking community in Mali. Their history includes the kingdoms of Segou and Kaarta and wider Mande trade and political traditions.", "Farming, market trade, craft production and urban work are important. Extended families and village associations support agricultural and social life.", "Bamana culture includes oral history, initiation associations, textile and woodcraft, masks and storytelling. Practices differ by region.", "The balafon, ngoni lute, drums and griot praise singing are associated with Bamana and wider Mande traditions. Dance and song accompany ceremonies."),
          cultureTopic("Mauritania", "Bidhan (Moor) communities", "Bidhan communities are Hassaniya Arabic-speaking populations of the western Sahara and Sahel, shaped by Amazigh, Arab and Saharan histories, pastoral networks and caravan trade.", "Nomadic and semi-nomadic pastoralism historically centred on camels, goats and sheep. Many families now combine town life, trade, farming and public employment.", "Hassaniya poetry, hospitality, tea ceremonies, Islamic learning and distinctive dress are important. Mauritania also includes Pulaar, Soninke, Wolof and other communities.", "The tidinit lute and ardin harp are associated with Mauritanian music. Griots preserve songs and praise poetry; styles vary by region."),
          cultureTopic("Mauritius", "Mauritian Creole communities", "Mauritian Creole culture developed through the plantation era and encounters among African, Malagasy, European and Asian influences. Enslaved Africans and their descendants helped shape Creole society.", "Creole communities form part of Mauritius's multilingual, multi-faith society. Family life, coastal livelihoods, urban work, food and neighbourhood networks contribute to identity.", "Mauritian Creole is widely used in everyday life. Food, storytelling, religious festivals and community celebrations reflect the island's blended history.", "Sega is a defining musical and dance tradition with roots in enslaved African communities. Ravanne drums, maravanne shakers and triangle accompany song and dance."),
          cultureTopic("Morocco", "Amazigh (Berber)", "Amazigh peoples are indigenous to North Africa and have shaped Morocco's history through mountain, oasis and coastal communities, dynasties, trade and resistance to outside powers.", "Agriculture, pastoralism, crafts, trade and urban employment vary across the Rif, Atlas and Souss regions. Tamazight, Tarifit and Tashelhit are among the Amazigh languages.", "Village festivals, weaving, silver jewellery, pottery, oral poetry and Yennayer are important. Practices differ greatly between regions.", "Ahidous and ahwash are well-known group song-and-dance forms in parts of the Atlas and Souss. Bendir drums, flutes and string instruments feature in regional styles."),
          cultureTopic("Mozambique", "Makhuwa (Makua)", "The Makhuwa are a major Bantu-speaking community concentrated in northern Mozambique. Their history includes Indian Ocean trade, coastal connections, Portuguese colonial rule and independence.", "Cassava and other crops, fishing, market trade and urban livelihoods are important. Matrilineal kinship and inheritance occur in many communities, with local variation.", "Oral storytelling, family ceremonies, initiation traditions and weaving are part of Makhuwa cultural life. Practices vary across rural and urban settings.", "Tufo, a women's song-and-dance tradition in northern coastal Mozambique, is an important regional performance form. Drums and group singing accompany celebrations."),
          cultureTopic("Namibia", "Ovambo (Aawambo)", "Ovambo-speaking communities are concentrated in northern Namibia and southern Angola. Their history includes precolonial kingdoms, colonial rule and a central role in Namibia's independence struggle.", "Cattle keeping, crop farming, trade and wage employment are important. Homesteads and extended family relationships remain influential.", "Olufuko initiation ceremonies, homestead practices, basketry and community festivals are cultural features in some Ovambo groups. Traditions differ among communities.", "Omuhiva and other local dances use drums, clapping, singing and group movement. Contemporary Namibian music blends these forms with modern genres."),
          cultureTopic("Niger", "Hausa", "The Hausa are a major people of the central Sahel, with long-established city-states and trading centres across Niger and Nigeria. Their history includes trans-Saharan commerce, Islamic scholarship and regional emirates.", "Farming, livestock, trade and crafts are important. Markets, extended families and Islamic institutions connect Hausa towns and rural communities.", "Hausa cultural expression includes oral poetry, leatherwork, embroidery, architecture, wedding customs and storytelling.", "Praise singing, the one-string goge fiddle, drums and kalangu talking drum accompany ceremonies and popular performance."),
          cultureTopic("Nigeria", "Yoruba", "The Yoruba are one of Nigeria's largest ethnolinguistic groups, with historic city-states including Ife and Oyo. Their history includes trade, the Atlantic slave trade, colonial rule and influential diaspora communities.", "Farming, markets, crafts, education, professional work and urban enterprise are important. Yoruba cities and towns have long been centres of trade and learning.", "Yoruba heritage includes orisa traditions, Christianity and Islam, naming and wedding ceremonies, beadwork, indigo textiles and Egungun masquerade.", "Bata drums, talking drums, praise poetry, ritual song and dance are major forms. Juju and fuji developed from Yoruba performance traditions."),
          cultureTopic("Rwanda", "Hutu communities", "Hutu communities form Rwanda's largest population group. Their history is intertwined with Tutsi and Twa communities through the kingdom, colonial rule, independence and the 1994 genocide; ethnic identity and history require careful context.", "Smallholder agriculture has long been important, alongside urban employment, trade, education and public service. Family and community networks play a major role.", "Many customs, language practices and ceremonies are shared across Hutu, Tutsi and Twa communities. Imigongo art, basketry and family ceremonies form part of wider Rwandan heritage.", "The royal drum tradition, ingoma, and Intore dance are widely recognised Rwandan cultural forms and are shared as national heritage."),
          cultureTopic("São Tomé and Príncipe", "Forro", "Forro communities developed from the island's plantation society and descendants of enslaved Africans and mixed-heritage populations. Their history is closely linked to Portuguese colonial rule and cocoa and coffee economies.", "Farming, fishing, public employment and urban livelihoods are important. Family networks, island communities and Creole language shape everyday life.", "Forro Creole language, food, dance, storytelling and community celebrations are distinctive. Shared heritage includes African mainland and Portuguese influences.", "Ussua and socopé are recognised São Toméan music and dance forms. Puita and other percussion traditions accompany festivals."),
          cultureTopic("Senegal", "Wolof", "The Wolof have a long history in the Senegambia region, including the Jolof Empire and later kingdoms. Their history includes Atlantic trade, Islamic scholarship and French colonial rule.", "Farming, fishing, trade, transport, crafts and urban enterprise are important. Wolof is widely used as a lingua franca alongside French and other national languages.", "Teranga, often understood as hospitality, is an important value. Oral poetry, wrestling, family ceremonies, food and Islamic traditions are visible in daily life.", "Sabar drumming and dance are well-known Wolof forms. Mbalax draws on sabar rhythms and other local and global influences."),
          cultureTopic("Seychelles", "Seychellois Creole communities", "Seychellois Creole culture developed through settlement by Africans, Europeans and later Asian communities under French and British colonial rule. African and Malagasy heritage are important influences.", "Island livelihoods have been shaped by fishing, farming, maritime work, tourism and public services. Family and neighbourhood networks connect the islands and diaspora.", "Seychellois Creole language, cuisine, religious observances, storytelling and festivals reflect the islands' mixed heritage.", "Moutya, with African roots, is a major song-and-dance tradition. Sega and other Creole styles combine drums, rhythm and storytelling."),
          cultureTopic("Sierra Leone", "Mende", "The Mende are one of Sierra Leone's largest communities, concentrated in the south and east. Their history includes precolonial chiefdoms, Atlantic trade, colonial rule and the independence movement.", "Rice cultivation, farming, trade and public-sector work are important. Family, town and chiefdom relationships remain influential.", "Poro and Sande are traditional institutions in some Mende communities, with roles in social education and organisation. Masking and oral history are significant.", "Drums, masked dance, women's songs and call-and-response accompany ceremonies. Bondo/Sande song traditions are important in women's cultural life."),
          cultureTopic("Somalia", "Somali", "Somali communities share a Cushitic language and a long history across the Horn of Africa. Indian Ocean trade, pastoral networks, Islamic scholarship and coastal sultanates shaped Somali history.", "Pastoralism, trade, fishing and urban livelihoods are important. Clan and family networks, mobility and cross-border connections have historically shaped social organisation.", "Poetry is central to Somali cultural expression, alongside Islamic celebrations, wedding customs, hospitality and traditional dress. Oral poetry carries history and public debate.", "The oud, kaban, drums and vocal performance feature in Somali music. Heello and modern song forms blend poetic traditions with urban influences."),
          cultureTopic("South Africa", "Zulu", "The Zulu-speaking people are part of the wider Nguni cultural family. The Zulu kingdom expanded in the early nineteenth century under Shaka and became central to later colonial conflicts.", "Cattle keeping and farming have historical importance, while mining, urban employment, education and migration shape modern Zulu life.", "Beadwork, izibongo praise poetry, wedding customs and the Umkhosi woMhlanga Reed Dance are recognised cultural expressions. Practices vary by region and family.", "Indlamu dance, maskandi guitar music, isicathamiya choral singing and ingoma performance are prominent styles."),
          cultureTopic("South Sudan", "Dinka (Jieng)", "The Dinka are South Sudan's largest ethnic community, with a long history in the Nile basin and surrounding grasslands. Their history includes pastoral societies, colonial rule, civil war and independence in 2011.", "Cattle have major economic, social and symbolic importance in many communities, alongside crop cultivation, fishing and urban livelihoods. Seasonal movement shapes pastoral areas.", "Poetry, cattle names, wrestling and age-set traditions appear in Dinka cultural history. Current practices differ by locality and generation.", "Cattle songs, praise poetry, dance and communal singing are important. Songs often celebrate relationships between people, land and cattle."),
          cultureTopic("Sudan", "Beja", "The Beja are an Indigenous Cushitic-speaking people of the Red Sea Hills and eastern Sudan, with communities extending into Eritrea and Egypt. Their history includes pastoral networks and Red Sea trade.", "Camel and livestock herding, trade and seasonal movement have historically been important. Many families now combine pastoral livelihoods with town-based work and education.", "Beja languages, distinctive dress, poetry, oral history and customary institutions are important. The Beja include diverse groups such as the Hadendowa and Beni Amer.", "Songs, dance, drums and lyre traditions accompany celebrations and social gatherings. Oral poetry preserves stories of place and community."),
          cultureTopic("Tanzania", "Sukuma", "The Sukuma are Tanzania's largest ethnic community, concentrated around the southern and eastern shores of Lake Victoria. Their history includes regional chiefdoms, farming, livestock and the modern Tanzanian state.", "Farming, livestock keeping, fishing and trade are important. Cotton and food crops and links to Mwanza and other towns shape livelihoods.", "Community ceremonies, oral storytelling and local performance traditions are important. The Bujora cultural centre preserves Sukuma heritage, instruments and dance.", "Ngoma dance traditions, drums, rattles and group singing are widely recognised. Some performances use dramatic movement and large dance groups."),
          cultureTopic("Togo", "Ewe", "The Ewe are a major people of southern Togo and neighbouring Ghana and Benin. Their history includes migration traditions, coastal trade, local kingdoms and colonial boundary divisions.", "Farming, fishing, trading, crafts and urban employment are important. Family networks connect Ewe communities across the Gulf of Guinea.", "Hogbetsotso, celebrated by Anlo-Ewe communities in Ghana, preserves migration history and identity. Weaving, pottery, oral histories and family ceremonies are important.", "Agbadza and borborbor are well-known Ewe song-and-dance forms, accompanied by drums, bells and call-and-response singing."),
          cultureTopic("Tunisia", "Amazigh communities", "Amazigh communities are indigenous to North Africa and have deep roots in present-day Tunisia, especially in parts of the south, Djerba and older mountain settlements.", "Oasis farming, pastoralism, crafts, trade and urban work have shaped different communities. Many Tunisian families have mixed Arab and Amazigh ancestry and cultural influences.", "Distinctive village architecture, weaving, jewellery, oral traditions and Yennayer are important in some communities. Customs vary by locality.", "Amazigh songs, drums and group dances accompany weddings and seasonal events. Tunisian music also reflects Arab-Andalusian, Mediterranean and sub-Saharan influences."),
          cultureTopic("Uganda", "Baganda", "The Baganda are Uganda's largest ethnic community and are associated with the historic Kingdom of Buganda on Lake Victoria. Buganda developed influential royal, clan and administrative institutions.", "Farming, fishing, trade, education and urban employment are important. Clan identities and family networks remain significant in central Uganda and Kampala.", "Barkcloth making, the Kabaka's court, clan totems, marriage customs and royal ceremonies are notable traditions. Barkcloth is recognised by UNESCO.", "Amadinda and akadinda xylophones, royal drums, songs and Kiganda dance are central cultural forms. Contemporary music blends traditional rhythms with modern genres."),
          cultureTopic("Zambia", "Bemba", "The Bemba are a major Bantu-speaking people of northern Zambia, with historic links to the Luba-Lunda world and the Bemba kingdom under the Chitimukulu.", "Farming, fishing, trade and wage employment are important. Matrilineal clan and family networks are prominent in many communities, while Copperbelt migration shapes modern life.", "Ukusefya pa Ng'wena, associated with Bemba royal history, is a major cultural event. Initiation, oral histories, pottery and basketry also feature.", "Ingoma and other group dances use drums, singing and coordinated movement. Praise songs and call-and-response accompany ceremonies."),
          cultureTopic("Zimbabwe", "Shona", "The Shona are Zimbabwe's largest ethnolinguistic group and are connected to the historic states of Great Zimbabwe. Their history includes precolonial kingdoms, colonial rule and the independence struggle.", "Crop farming, livestock keeping, trade, mining and urban work are important. Extended family and ancestral connections remain influential.", "Shona heritage includes the bira ceremony, ancestral spirit traditions, oral storytelling, mbira making and stone sculpture. Practices vary among Shona subgroups.", "The mbira dzavadzimu, hosho rattles, drums and vocal harmonies are central to bira and other performances. Shona music influences contemporary Zimbabwean genres.")
        ]
      },
      {
        title: "African festivals and celebrations",
        description: "Explore the stories, meanings and living traditions behind celebrations across Africa.",
        items: [
          festivalTopic("Homowo", "The Ga people of the Greater Accra area remember a period of famine in their history and the return of food security after successful harvests.", "The name means “hooting at hunger”. It honours resilience, collective survival, gratitude and the memory of ancestors.", "Families prepare kpokpoi or kpekple, which is shared and sprinkled by traditional leaders and family heads. Celebrations include drumming, singing, dancing, processions and family gatherings.", "Ga communities across Greater Accra, Ghana, with major celebrations in Accra and Ga Mashie."),
          festivalTopic("Aboakyer", "The Effutu people of Winneba trace the festival to ancestral traditions of offering a bushbuck to the deity Penkyi Otu.", "It expresses thanksgiving, spiritual devotion, communal identity and the relationship between the people and their traditional authorities.", "Two Asafo companies take part in a ceremonial bushbuck hunt. The animal is presented to the deity, followed by drumming, dancing, a durbar and public festivities.", "Winneba, Central Region, Ghana."),
          festivalTopic("Hogbetsotso", "The Anlo-Ewe people commemorate their ancestors' migration from Notsie, in present-day Togo, to their current settlements in southeastern Ghana.", "The festival recalls the struggle for freedom, unity, courage and the preservation of collective memory.", "Communities hold processions, traditional dances, storytelling, clean-up activities and a durbar of chiefs. Historical accounts and family memories are shared.", "Anloga and the Anlo area of the Volta Region, Ghana."),
          festivalTopic("Fetu Afahye", "The people of Oguaa, now Cape Coast, remember a devastating disease outbreak and the traditional purification associated with its ending.", "The celebration expresses thanksgiving, remembrance, renewal and a shared responsibility for community wellbeing.", "Traditional rites and purification activities lead into processions, drumming, dancing and a gathering of chiefs and residents.", "Cape Coast, Central Region, Ghana."),
          festivalTopic("Damba", "Damba developed among Dagomba and neighbouring northern Ghanaian communities, with traditions linked to the birth and naming of the Prophet Muhammad and the history of chieftaincy.", "It brings together Islamic cultural influence, respect for traditional authority, community identity and royal heritage.", "Celebrations include drumming, horse processions, traditional dance, public gatherings and appearances by chiefs. The programme and religious observances vary by community.", "Dagbon, especially Tamale and Yendi in northern Ghana; related celebrations occur in other northern communities."),
           festivalTopic("Akwasidae Festival", "Akwasidae is part of the Asante Adae calendar, a cycle of traditional observances rooted in the royal and ancestral institutions of the Asante kingdom.", "It honours ancestors and deceased Asante rulers, renews the relationship between the Asantehene, chiefs and people, and affirms the continuity of Asante identity and royal authority.", "On the appointed Sunday, the Asantehene receives chiefs and visitors in state at Manhyia Palace. Chiefs and elders wear ceremonial regalia; libation, prayers, greetings, drumming and praise singing form part of the occasion. Akwasidae follows the Adae cycle, approximately every six weeks.", "Manhyia Palace in Kumasi, Ashanti Region, Ghana, with related observances among Asante communities and the diaspora."),
          festivalTopic("Osun-Osogbo Festival", "The annual festival grew from the sacred relationship between the people of Osogbo and Osun, the Yoruba river deity, and has been maintained through generations of community and royal custodianship.", "It honours Osun, celebrates spiritual heritage and renews the bond between the community, the river and the sacred grove.", "A sequence of rites and processions culminates in a procession to the Osun-Osogbo Sacred Grove, with prayers, offerings, music, dance and participation by devotees and visitors.", "Osogbo, Osun State, southwestern Nigeria, especially the Osun-Osogbo Sacred Grove."),
          festivalTopic("Sango Festival of Oyo", "The festival commemorates Sango, the Yoruba deity associated with thunder and lightning, and the historical memory of the Oyo kingdom and its rulers.", "It marks the Yoruba traditional new year in Oyo and reinforces ancestral reverence, cultural identity and community solidarity.", "The multi-day celebration features rituals, red and white attire, chanting, storytelling, drumming, dancing and the sharing of new yam and palm oil.", "Oyo, Oyo State, Nigeria, including sites associated with the historic Oyo kingdom."),
          festivalTopic("Timkat (Ethiopian Epiphany)", "Timkat is rooted in the Ethiopian Orthodox Tewahedo Church's commemoration of the baptism of Jesus Christ in the River Jordan.", "It represents spiritual renewal, blessing, faith and the importance of the church community.", "Church tabots, sacred replicas associated with the Ark, are carried in processions to water. Worshippers attend prayers and hymns, followed by the blessing and sprinkling of water and processions back to churches.", "Celebrated throughout Ethiopia, with major gatherings in Addis Ababa, Gondar and Lalibela."),
          festivalTopic("Meskel", "Meskel commemorates the Ethiopian Orthodox tradition of the discovery of the True Cross. Its observance has a long history in the Ethiopian church.", "The celebration expresses Christian faith, spiritual hope, reconciliation and community unity.", "Communities build the Demera bonfire, decorate it with flowers and greenery, sing hymns and pray. The bonfire is lit during a public ceremony, followed by family and community gatherings.", "Across Ethiopia, with a major national gathering at Meskel Square in Addis Ababa."),
          festivalTopic("Irreecha", "Irreecha is an Oromo thanksgiving tradition historically connected to the end of the rainy season and the transition into a new season.", "It gives thanks for life, peace, rain, fertility, harvest and the natural world, while affirming Oromo identity and unity.", "Participants gather with fresh grass and flowers, wear traditional clothing, sing, dance and offer prayers and thanksgiving near water.", "Celebrated by Oromo communities across Ethiopia, with large gatherings at Hora Arsadi in Bishoftu and in Addis Ababa."),
          festivalTopic("Gifaataa", "Gifaataa is the Wolaita people's New Year celebration, transmitted through family and community traditions over generations.", "It welcomes a new year and emphasizes peace, reconciliation, family unity, respect for elders and social solidarity.", "People clean their surroundings, return home, resolve disputes, share traditional food and drink, receive elders' blessings, and gather around bonfires for songs and dances. The wider celebration includes horse riding and communal festivities.", "Wolaita Zone in southern Ethiopia, especially communities around Sodo."),
          festivalTopic("Fichee-Chambalaalla", "According to Sidama oral tradition, the festival recalls a married woman who returned annually to visit her parents and relatives, bringing food to share with neighbours.", "It is a Sidama New Year celebration and a symbol of generosity, kinship, equality, social harmony and cooperation.", "The date is announced by traditional leaders after consultation. Families share buurisame, children visit neighbours, and communities hold songs, dances and public gatherings.", "Sidama communities in southern Ethiopia, including around Hawassa."),
          festivalTopic("Moussem of Tan-Tan", "The gathering developed from seasonal meetings among Saharan nomadic communities, linked to pastoral calendars, trade and movement across desert routes.", "It preserves nomadic heritage, social exchange, hospitality, oral traditions and relationships among communities of the Sahara.", "Tribes gather for trade and social visits, camel and horse competitions, music, dance, poetry, traditional crafts and celebrations such as weddings.", "Tan-Tan in southwestern Morocco, bringing together communities from southern Morocco and neighbouring parts of northwest Africa."),
          festivalTopic("Yennayer (Amazigh New Year)", "Yennayer follows the Amazigh agricultural calendar and marks the beginning of the year in Amazigh communities across North Africa.", "It celebrates renewal, the farming cycle, hopes for abundance, family continuity and Amazigh cultural identity.", "Families prepare special meals using grains, fruits and seasonal produce, gather across generations, share stories and music, and observe local customs that differ by region.", "Amazigh communities across Morocco, Algeria, Tunisia, Libya and other parts of North Africa; practices vary by locality."),
          festivalTopic("Moussem of Imilchil (Marriage Festival)", "The gathering is associated with local Ait Hadiddou Amazigh communities of the High Atlas and stories surrounding marriage, family and tribal relationships.", "It provides a setting for social reunion, cultural continuity, courtship and the celebration of Amazigh identity. Popular romantic legends are part of its modern public image.", "The gathering includes a market, music, dance, traditional clothing, social visits and cultural events. The format has evolved and should not be reduced to a mass arranged-marriage event.", "Imilchil and surrounding villages in Morocco's High Atlas Mountains."),
          festivalTopic("Gule Wamkulu", "Gule Wamkulu is a masked dance tradition associated with the Chewa people and the Nyau brotherhood, with roots in initiation and ancestral practices.", "It connects communities with ancestral knowledge, moral teaching, social commentary, rites of passage and the transmission of cultural values.", "Masked performers appear at funerals, initiation-related events and other community occasions, using dance, music and symbolic characters. Performances are guided by community customs.", "Chewa communities in Malawi, Mozambique and Zambia, especially in rural areas."),
          festivalTopic("Umhlanga (Reed Dance)", "Umhlanga developed as a royal and community ceremony in the Swazi kingdom, bringing young women together to cut reeds for the royal residence.", "It expresses service to the community and monarchy, cultural continuity, collective identity and the value placed on young women's participation in tradition.", "Participants gather reeds, carry them in procession and perform traditional songs and dances before the royal family. Participation and ceremony follow established cultural protocols.", "Ludzidzini Royal Residence and other designated sites in Eswatini."),
          festivalTopic("Incwala", "Incwala is an important Swazi kingship ceremony with roots in the kingdom's agricultural and royal traditions.", "It marks the traditional new year and is associated with renewal, the monarchy, national unity and the first fruits of the season.", "The multi-stage ceremony includes the gathering of sacred branches, ritual observances and collective singing and dancing involving the king and participants.", "Royal sites in Eswatini, centred on the royal residence and other places designated for the ceremony."),
          festivalTopic("Mwaka Kogwa", "Mwaka Kogwa is a Shirazi-influenced New Year celebration whose traditions are associated with Persian cultural connections in the Indian Ocean.", "It welcomes a new year through symbolic renewal, the release of past grievances, reconciliation and community wellbeing.", "Celebrations include symbolic mock fighting with banana stems, songs, dances and communal feasting. Local customs and interpretations vary.", "Makunduchi in southern Zanzibar, Tanzania."),
          festivalTopic("Maulidi ya Lamu", "The Lamu Maulidi celebrations developed around the commemoration of the birth of Prophet Muhammad and the long-standing Islamic learning traditions of the Swahili coast.", "It brings together religious devotion, scholarship, hospitality and the shared Swahili Muslim heritage of the Indian Ocean coast.", "Visitors and residents attend prayers, recitations, religious poetry, processions and cultural activities, alongside community hospitality and local events.", "Lamu Old Town and Lamu Island, Kenya."),
          festivalTopic("Grand Magal of Touba", "The Magal commemorates the 1895 exile of Sheikh Amadou Bamba by the French colonial authorities, an important event in the history of the Mouride Muslim brotherhood.", "It honours religious devotion, perseverance, service and the teachings of Sheikh Amadou Bamba.", "Pilgrims travel to Touba for prayers, Quran recitations, religious gatherings, charitable hospitality and visits to important religious sites.", "Touba, Senegal."),
          festivalTopic("Kankurang Manding Initiation", "The Kankurang is a masked figure connected to Manding initiation traditions and the transmission of community law and knowledge.", "It represents protection, discipline, social order, ancestral authority and the education of younger generations.", "A masked performer appears during initiation periods and community ceremonies, accompanied by songs, drumming and processions. The practice follows specific community rules and meanings.", "Manding communities in The Gambia and Senegal, including areas around Casamance and the Senegambian region."),
          festivalTopic("Sanké Mon", "Sanké Mon is a collective fishing rite linked to the founding history of San and to the seasonal cycle of the Sanké pond.", "It marks the beginning of the rainy season and reinforces cooperation, peace, solidarity and shared responsibility for water resources.", "Community members gather for a collective fishing event, accompanied by music, dance, arts, crafts and customary observances.", "San in the Ségou Region of Mali, at the Sanké pond."),
          festivalTopic("Yaaral and Degal", "These seasonal gatherings are associated with Fulani pastoral communities moving cattle to and from the inland Niger Delta's floodplains.", "They celebrate pastoral knowledge, cattle heritage, seasonal cooperation, social bonds and the relationship between people, livestock and the environment.", "Communities gather for cattle crossings, decorated herds, poetry, music, dancing and public competitions. The timing follows the flood and grazing cycle.", "The inland Niger Delta in Mali, especially around Diafarabé and the region of Djenné."),
          festivalTopic("Famadihana (Turning of the Bones)", "Famadihana developed among some Malagasy communities as a family ancestral rite connected to the rewrapping and remembrance of deceased relatives.", "It expresses respect for ancestors, family continuity, remembrance and the enduring bonds between generations.", "Relatives gather, open family tombs according to local custom, rewrap ancestral remains in fresh shrouds, carry them with music and dancing, and share a communal meal. Practices vary and not all Malagasy communities observe it.", "Practised by some communities in the central highlands of Madagascar."),
          festivalTopic("Lake of Stars Festival", "Founded in the 2000s, Lake of Stars is a contemporary Malawian arts and music festival created to showcase local creativity and connect Malawian performers with international artists.", "It promotes contemporary African music, creative exchange, tourism and cultural collaboration rather than an ancient ritual tradition.", "The programme features live music, dance, visual arts, food and cultural events, with Malawian and international performers.", "Held at venues around Lake Malawi; the host location can vary by edition."),
          festivalTopic("Okyir Festival (Anomabo)", "Okyir, also called Okyir Okyir in local usage, is a Fante festival associated with Anomabo. Its history is linked to the community's seasonal calendar, thanksgiving and customary ideas of cleansing and renewal.", "The festival gives thanks, honours ancestors and renews the community. It is also a time to address shared concerns, review local progress and strengthen relationships among the chief, Asafo companies, residents and people returning from outside the town.", "Preparations include cleaning homes and public spaces. Asafo companies and community groups take part in processions, and the celebration reaches a climax with a durbar of chiefs and people. Cultural performances, music, dance and public discussion are also part of the programme.", "Okyir is celebrated in Anomabo in Ghana's Central Region, usually in the second week of October. Dates and programme details are set locally by the traditional authorities."),
          festivalTopic("Cape Town Minstrel Carnival (Kaapse Klopse)", "The carnival has roots in Cape Town's enslaved and working-class communities and developed through New Year street celebrations, performance and local musical traditions.", "It reflects resilience, creativity, community belonging and the cultural history of Cape Town's Coloured communities.", "Organised minstrel troupes parade in colourful uniforms with brass bands, banjos, singing, dancing and competitions.", "Cape Town, Western Cape, South Africa, particularly the city centre and community parade routes.")
        ]
      },
      {
        title: "Major African kingdoms",
        description: "Explore major historic kingdoms and royal states that shaped African history. This collection excludes small local chiefdoms and territories.",
        items: [
          kingdomTopic("Ancient Egyptian Kingdoms", "Egypt", "c. 3100–30 BCE", "The successive Old, Middle and New Kingdom periods formed the central phases of ancient Egyptian state power along the Nile. They were shaped by pharaonic rule, regional administration, monumental building, agriculture and long-distance exchange.", "Pyramids, temples, tombs, hieroglyphic records and innovations in administration, engineering and religious life remain among the world's most influential historical legacies."),
          kingdomTopic("Kingdom of Kush", "Ancient Nubia; present-day Sudan and southern Egypt", "c. 8th century BCE–4th century CE", "Kush developed along the Nile south of Egypt, with major centres at Napata and Meroë. Kushite rulers at one stage ruled Egypt as its Twenty-Fifth Dynasty, while later Meroë became a major political and commercial centre.", "Kushite pyramids, temples, Meroitic writing, ironworking and distinctive royal traditions remain visible at Meroë, Naqa and Musawwarat es-Sufra."),
          kingdomTopic("Kingdom of Numidia", "Present-day Algeria and parts of Tunisia", "c. 3rd–1st century BCE", "Numidia was a major Amazigh-Berber kingdom of North Africa. Its rulers, including Masinissa, built a strong state whose alliances and conflicts shaped the politics of the western Mediterranean.", "Numidian horsemen, political diplomacy, agricultural wealth and the development of North African kingdoms influenced the region before Roman annexation."),
          kingdomTopic("Kingdom of Mauretania", "Present-day northern Morocco and western Algeria", "c. 3rd century BCE–1st century CE", "Mauretania was an ancient Berber kingdom in northwest Africa. It became a client kingdom of Rome under rulers including Juba II before being annexed as a Roman province.", "Its history reflects the interaction of Amazigh, Phoenician, Hellenistic and Roman cultures in the western Maghreb."),
          kingdomTopic("Garamantian Kingdom", "Fezzan, present-day southwestern Libya", "c. 1st millennium BCE–7th century CE", "The Garamantes built a powerful Saharan kingdom around oasis settlements in the Fezzan. They supported agriculture in a dry environment through underground water channels and controlled important trans-Saharan routes.", "Their cities, irrigation systems, burial sites and desert trade networks demonstrate sophisticated settlement and engineering in the Sahara."),
          kingdomTopic("Kingdom of D'mt", "Northern Ethiopia and Eritrea", "c. 1st millennium BCE", "D'mt was an early state in the northern Horn of Africa, associated with highland centres and Red Sea connections. Its political and cultural development preceded the rise of Aksum.", "Its monumental remains and inscriptions provide evidence of early state formation, regional trade and cultural exchange in the Horn of Africa."),
          kingdomTopic("Kingdom of Aksum", "Northern Ethiopia and Eritrea", "c. 1st–7th centuries CE", "Aksum became a major Red Sea kingdom, connecting the African interior with Arabia, the Mediterranean and Indian Ocean trade. It developed coinage, monumental stelae and an influential Christian court.", "Aksum's stelae, inscriptions, coins, church traditions and trade history are central to the heritage of the Horn of Africa."),
          kingdomTopic("Ethiopian Kingdom (Solomonic Monarchy)", "Ethiopia", "1270–1974, with earlier Ethiopian royal traditions", "The Solomonic dynasty became a long-lasting Ethiopian royal house, ruling through changing political centres and periods of centralisation and regional autonomy. Ethiopian kingship was closely connected to the Ethiopian Orthodox Church and highland political traditions.", "The monarchy shaped Ethiopian statehood, religious architecture, manuscripts, court culture and resistance to European colonial expansion."),
          kingdomTopic("Kingdom of Asante", "Present-day Ghana", "c. 1701 onward as a unified kingdom", "The Asante kingdom was consolidated under Osei Tutu and Okomfo Anokye, with Kumasi as its capital and the Golden Stool as a central symbol of national unity and spiritual authority.", "Asante political organisation, gold regalia, kente weaving, the Asantehene institution and Akwasidae observances remain influential in Ghana and the diaspora."),
          kingdomTopic("Kingdom of Benin", "Edo region, present-day southern Nigeria", "c. 13th century–1897", "The Benin kingdom developed a centralised court under the Oba, with Benin City as its capital. It became renowned for sophisticated bronze and brass casting, palace art, urban planning and diplomatic trade.", "Benin's court arts, royal histories, bronze plaques and long-standing Oba institution remain major parts of Nigerian and global cultural heritage."),
          kingdomTopic("Kingdom of Dahomey", "Present-day southern Benin", "c. 17th century–1894", "Dahomey grew into a centralised Fon kingdom with its capital at Abomey. Its rulers developed strong royal institutions, military organisation and commercial links with the Atlantic coast.", "The Royal Palaces of Abomey, royal history, appliqué textiles, court ceremonies and the memory of the Agojie are important parts of Beninese heritage."),
          kingdomTopic("Oyo Kingdom", "Southwestern present-day Nigeria", "c. 14th–19th centuries", "Oyo became a major Yoruba kingdom whose political influence extended across much of the Yoruba region and into neighbouring areas. Its administration combined the authority of the Alaafin with important councils and provincial institutions.", "Oyo's cavalry, political institutions, Yoruba cultural traditions and influence on regional trade shaped the history of the Bight of Benin."),
          kingdomTopic("Kingdom of Ife", "Ile-Ife, southwestern present-day Nigeria", "c. 11th–15th centuries and continuing sacred royal traditions", "Ife was a major Yoruba sacred and political centre ruled by the Ooni. It became renowned for naturalistic terracotta and brass or copper-alloy sculpture and for its role in Yoruba origin traditions.", "Ife's sculpture, sacred sites, royal traditions and artistic influence are central to Yoruba history and the wider history of African art."),
          kingdomTopic("Jolof Kingdom", "Senegambia, centred in present-day Senegal", "c. 14th–19th centuries", "The Jolof kingdom linked Wolof-speaking states and communities in the Senegambia region. Its authority changed over time as powerful constituent states asserted greater independence.", "Jolof history, Wolof language, oral tradition and political relationships shaped the later states of Cayor, Baol, Waalo and Sine-Saloum."),
          kingdomTopic("Mossi Kingdoms", "Central Burkina Faso", "c. 11th century onward", "The Mossi kingdoms, including Ouagadougou, Tenkodogo and Yatenga, formed influential royal states across the central Volta region. Their rulers developed durable institutions and negotiated trade, migration and colonial expansion.", "Mossi royal institutions, the Mogho Naba, oral histories, horse traditions and community festivals remain important in Burkina Faso."),
          kingdomTopic("Kingdom of Kanem", "Lake Chad basin, centred in present-day Chad", "c. 8th–14th centuries", "Kanem was a major kingdom around the northeastern shores of Lake Chad. Its rulers controlled trans-Saharan routes and maintained political and commercial links across the central Sahel.", "Kanem's royal traditions and later continuation in the Bornu state influenced the history of the Lake Chad region."),
          kingdomTopic("Kingdom of Kongo", "Present-day northern Angola, western DRC and Republic of the Congo", "c. 14th–19th centuries", "Kongo was one of Central Africa's largest centralised kingdoms, with its capital at Mbanza Kongo. It developed provincial administration, royal diplomacy and extensive trade networks, including early relations with Portugal.", "Kongo Christianity, court art, political history and the legacy of its royal capital remain important across the lower Congo region."),
          kingdomTopic("Kingdom of Ndongo", "Present-day Angola", "c. 16th–17th centuries", "Ndongo was a major Mbundu-speaking kingdom in central-western Angola. Queen Njinga became its most celebrated ruler, leading diplomacy and resistance against Portuguese expansion.", "The kingdom's history, Queen Njinga's leadership and the struggle for political autonomy are central to Angolan historical memory."),
          kingdomTopic("Luba Kingdom", "Present-day southeastern Democratic Republic of the Congo", "c. 16th–19th centuries", "The Luba kingdom developed a centralised political system based on sacred kingship, councils, court offices and networks of chiefly authority across the Central African savanna.", "Luba political thought, court art, oral historians and the lukasa memory board are significant contributions to African political and cultural history."),
          kingdomTopic("Lunda Kingdom", "Present-day DRC, Angola and Zambia", "c. 17th–19th centuries", "The Lunda kingdom grew into a large Central African royal state linking communities across the savanna and controlling important trade routes. Its political influence extended through related ruling houses and allied states.", "Lunda royal institutions, court traditions and trade connections shaped the political history of the Central African interior."),
          kingdomTopic("Kuba Kingdom", "Kasai region, present-day Democratic Republic of the Congo", "c. 17th–20th centuries", "The Kuba kingdom was consolidated under Shyaam a-Mbul a-Ngwoong and became known for a structured royal court and highly developed artistic traditions.", "Kuba textile design, carved objects, raffia work, royal regalia and political institutions are internationally recognised."),
          kingdomTopic("Kingdom of Loango", "Atlantic coast of present-day Republic of the Congo and neighbouring areas", "c. 15th–19th centuries", "Loango was a major coastal kingdom north of the Kongo state. Its rulers controlled important trade routes and maintained political and commercial links with inland communities and Atlantic merchants.", "Loango's coastal trading history, royal traditions and connections with the wider Kongo cultural region remain significant."),
          kingdomTopic("Kingdom of Buganda", "Present-day central Uganda", "c. 14th century onward", "Buganda developed on the northern shores of Lake Victoria into one of the Great Lakes region's most influential kingdoms. It built a centralised monarchy, clan system and administrative structure under the Kabaka.", "The Kabaka institution, barkcloth heritage, royal tombs, clan traditions and Buganda's political history remain central to Uganda's cultural life."),
          kingdomTopic("Bunyoro-Kitara Kingdom", "Western Uganda", "Historical Kitara traditions; Bunyoro prominent from the 16th century onward", "Bunyoro-Kitara is associated with older Kitara traditions and the later Bunyoro kingdom, a major Great Lakes state with influential royal institutions and control over important resources and trade routes.", "Bunyoro's royal history, the Omukama institution, oral traditions and historical royal centres remain important in western Uganda."),
          kingdomTopic("Kingdom of Rwanda", "Present-day Rwanda", "c. 15th century–1961", "The Rwandan monarchy grew through the expansion and consolidation of a central royal state. Its history involved complex institutions, regional authorities and changing social relations among Hutu, Tutsi and Twa communities.", "The kingdom shaped Rwanda's political institutions, royal ritual, court poetry, land systems and historical memory."),
          kingdomTopic("Kingdom of Burundi", "Present-day Burundi", "c. 17th century–1966", "The Kingdom of Burundi developed under a Ganwa royal dynasty and brought together different regions and communities under the mwami. It experienced major change during German and Belgian colonial rule.", "Burundi's royal drum tradition, court ceremonies and monarchy remain important in national cultural memory."),
          kingdomTopic("Kingdom of Ankole", "Southwestern Uganda", "c. 15th century–1967", "Ankole was a Great Lakes kingdom ruled by the Omugabe and known historically for its pastoral economy and long-horned Ankole cattle. It interacted with neighbouring states and colonial administration.", "Ankole royal history, cattle heritage, pastoral knowledge and local cultural traditions remain important in southwestern Uganda."),
          kingdomTopic("Kingdom of Kaffa", "Southwestern Ethiopia", "c. 14th century–1897", "Kaffa was a major highland kingdom in southwestern Ethiopia, with a royal court, agricultural wealth and control of forest and trade routes. It was incorporated into the Ethiopian empire in the late nineteenth century.", "Kaffa's history is associated with the wider history of coffee cultivation, forest landscapes and state formation in southwestern Ethiopia."),
          kingdomTopic("Kingdom of Mapungubwe", "Limpopo River region of present-day South Africa, Zimbabwe and Botswana", "c. 11th–13th centuries", "Mapungubwe was an early southern African kingdom and trading centre whose elite settlement occupied a hilltop above a wider agricultural and commercial landscape. It participated in Indian Ocean trade networks.", "Its gold objects, stone architecture, social organisation and archaeological remains provide evidence of early complex state formation in southern Africa."),
          kingdomTopic("Kingdom of Great Zimbabwe", "Present-day Zimbabwe", "c. 11th–15th centuries", "Great Zimbabwe was the centre of a powerful Shona-speaking state, built around monumental dry-stone architecture and linked to gold and cattle trade with the Swahili coast.", "The stone enclosures, royal traditions and trading connections are among Africa's most recognised archaeological and architectural legacies."),
          kingdomTopic("Kingdom of Mutapa", "Present-day Zimbabwe and central Mozambique", "c. 15th–18th centuries", "The Mutapa kingdom emerged from the political world associated with Great Zimbabwe and controlled important gold-producing areas and trade routes connecting the interior to the Indian Ocean coast.", "Mutapa's royal history, gold trade and diplomatic relations with Portuguese coastal settlements shaped the history of the Zambezi region."),
          kingdomTopic("Rozvi Kingdom", "Present-day Zimbabwe", "c. 17th–19th centuries", "The Rozvi kingdom rose in the Zimbabwe plateau after the decline of Mutapa influence. Its rulers developed a strong state with military organisation and control over important interior trade routes.", "Rozvi political history and stone-built centres form part of Zimbabwe's wider heritage of precolonial state formation."),
          kingdomTopic("Maravi Kingdom", "Present-day Malawi, Mozambique and Zambia", "c. 15th–18th centuries", "The Maravi was a major regional kingdom and political confederation associated with the Chewa and related communities around Lake Malawi and the Shire highlands.", "Maravi traditions, oral histories, regional trade and the Nyau cultural institution influenced the history of the central-southern African interior."),
          kingdomTopic("Zulu Kingdom", "Present-day KwaZulu-Natal, South Africa", "Early 19th century onward as a kingdom", "The Zulu kingdom was consolidated under Shaka and became a major southern African state. Its political and military history shaped regional power relations and later conflicts with Boer and British forces.", "Zulu language, royal traditions, praise poetry, beadwork and the continuing institution of the Zulu monarch remain influential."),
          kingdomTopic("Ndebele Kingdom", "Present-day Zimbabwe", "19th century–1890s", "The Ndebele kingdom was founded by Mzilikazi after the movement of Ndebele communities north of the Limpopo. It established a centralised state in the southwest of present-day Zimbabwe.", "Ndebele political history, stone-built settlements, beadwork, language and royal traditions remain part of Zimbabwe's national heritage."),
          kingdomTopic("Basotho Kingdom", "Present-day Lesotho", "Early 19th century onward", "Moshoeshoe I consolidated the Basotho nation during a period of regional upheaval, bringing communities together through diplomacy, alliance and strategic settlement in the mountain kingdom.", "The monarchy, Sesotho language, mokorotlo hat, blanket traditions and mountain heritage remain central to Lesotho's identity."),
          kingdomTopic("Kingdom of Eswatini (Swazi Kingdom)", "Present-day Eswatini", "18th century onward as a consolidated kingdom", "The Swazi kingdom developed through Nguni migrations and political consolidation under rulers including Sobhuza I and Mswati II. The monarchy remains a central institution of national life.", "The Dlamini monarchy, Incwala, Umhlanga, Swazi language and ceremonial traditions remain important in Eswatini."),
          kingdomTopic("Lozi Kingdom (Barotseland)", "Western Zambia", "c. 18th century onward, with earlier Luyi traditions", "The Lozi kingdom developed around the upper Zambezi floodplain under the Litunga. Its political life adapted to the seasonal rise and fall of the Barotse floodplain.", "The Litunga institution, the Kuomboka ceremony, royal barges and the floodplain's distinctive cultural landscape remain major elements of western Zambia's heritage."),
          kingdomTopic("Merina Kingdom", "Central highlands of Madagascar", "c. 16th century–1897", "The Merina kingdom grew around Imerina in Madagascar's central highlands and expanded across much of the island in the nineteenth century under rulers including Andrianampoinimerina and Radama I.", "The monarchy shaped Malagasy statehood, highland architecture, rice agriculture, language, education and the island's modern political history."),
          kingdomTopic("Sakalava Kingdoms", "Western and northwestern Madagascar", "c. 16th–19th centuries", "Sakalava rulers established major western Malagasy kingdoms, notably Menabe and Boina, through regional alliances, trade and control of coastal and inland routes.", "Sakalava royal tombs, ancestral traditions, local histories and the enduring role of royal relics remain significant in western Madagascar."),
          kingdomTopic("Ghana Empire (Wagadu)", "Western Sahel, centred in areas of present-day southeastern Mauritania and western Mali", "c. 6th–13th centuries", "Wagadu, commonly called the Ghana Empire in Arabic sources, was a major Soninke-led Sahelian state. Its rulers drew power from agriculture, regional authority and control of important gold and trans-Saharan trade networks. It was not located in the territory of the modern Republic of Ghana.", "Wagadu's political organisation, trade networks and place in Soninke historical memory make it a foundational state in West African history."),
          kingdomTopic("Mali Empire", "Upper Niger region, expanding across much of the western Sahel", "c. 13th–17th centuries", "Founded in the 13th century, the Mali Empire grew under Sundiata Keita and later rulers into a major imperial power. Its influence connected Mande-speaking regions, Saharan trade routes and prominent centres of scholarship and commerce.", "Mali's rulers, including Mansa Musa, its trans-Saharan connections and the scholarly centres of Timbuktu and Djenné remain central to the history of medieval Africa."),
          kingdomTopic("Songhai Empire", "Middle Niger region, centred on Gao in present-day Mali", "c. 15th–1591", "Songhai developed from an earlier Gao-based polity into a major empire under Sunni Ali and Askia Muhammad. It governed a wide territory through military power, provincial administration and control of Niger River and trans-Saharan trade.", "Gao, Timbuktu and Djenné became major political, commercial and scholarly centres. The empire's defeat by a Moroccan invasion in 1591 transformed the western Sahel."),
          kingdomTopic("Kanem-Bornu Empire", "Lake Chad basin, across areas of present-day Chad, Nigeria, Niger and Cameroon", "c. 8th–19th centuries", "The long-lived Kanem-Bornu state developed east of Lake Chad before its political centre shifted west to Bornu. Its rulers maintained dynastic institutions, Islamic scholarship and extensive trans-Saharan connections over many centuries.", "Its unusual longevity, written and oral records, court traditions and role in regional trade make it one of Africa's most enduring historical states."),
          kingdomTopic("Kingdom of Takrur", "Senegal River valley, in present-day Senegal and Mauritania", "c. 9th–13th centuries", "Takrur was an important early West African state along the Senegal River. It participated in regional commerce and was among the early centres of Islam's spread south of the Sahara.", "Takrur's history helps explain early state formation, religious change and trade in the western Sahel."),
          kingdomTopic("Kaabu Kingdom", "Upper Guinea region, mainly present-day Guinea-Bissau and parts of Senegal and Guinea", "c. 16th–1867", "Kaabu emerged as a powerful Mandinka state in the Senegambia and Upper Guinea region. It developed its own ruling elite and political institutions after the weakening of Mali's western authority.", "Kaabu's history is important to Mandinka political traditions and the histories of Guinea-Bissau, Senegal and the wider Upper Guinea coast."),
          kingdomTopic("Bono Kingdom", "Forest–savanna transition of present-day central Ghana", "At least from the 11th century; political forms changed over time", "Bono was an important Akan-speaking state associated with Bono Manso and later Bono political centres. Its influence was connected to gold production, trade and the development of early Akan states.", "Bono traditions and archaeological evidence contribute to understanding early Akan state formation and the history of gold and commerce in the forest–savanna zone."),
          kingdomTopic("Akwamu Kingdom", "Southeastern Ghana and adjoining areas of the former Gold Coast", "c. 17th–19th centuries", "Akwamu grew into a major Akan state with influence along important inland and coastal routes. At its height it exercised authority over a wide area and played a significant role in the political history of the Gold Coast.", "Akwamu's military, diplomatic and commercial history shaped the emergence and relationships of several neighbouring states."),
          kingdomTopic("Denkyira Kingdom", "Central forest region of present-day Ghana", "c. 17th–early 18th centuries", "Denkyira became a powerful Akan kingdom before its defeat by the Asante alliance in the early eighteenth century. Its rulers exercised influence over gold-producing areas and neighbouring polities.", "Denkyira's rise and decline are essential to understanding the political circumstances surrounding the formation and expansion of the Asante state."),
          kingdomTopic("Kingdom of Dagbon", "Northern Ghana", "Traditions trace its origins to the precolonial period; established state structures developed over centuries", "Dagbon is a major centralized kingdom of northern Ghana, ruled by the Yaa Naa. Its history includes dynastic traditions, political relationships with neighbouring states and periods of internal succession dispute.", "Dagbon's chieftaincy institution, royal court, oral histories and cultural traditions remain influential in northern Ghana."),
          kingdomTopic("Kingdom of Mamprugu", "Northeastern Ghana and adjoining areas", "Precolonial origins; royal traditions continue today", "Mamprugu is a historic kingdom of the wider Mole-Dagbani political and cultural region, ruled by the Nayiri. Its authority and relationships with neighbouring states have evolved over time.", "Mamprugu's royal traditions and role in the history of northern Ghana are important to the region's political and cultural heritage."),
          kingdomTopic("Almoravid Empire", "Sahara, Morocco and parts of the western Maghreb and al-Andalus", "c. 1040–1147", "The Almoravids emerged from Sanhaja Amazigh reform movements in the western Sahara and built an empire that united large parts of the Maghreb and crossed into the Iberian Peninsula. Marrakesh became a major political centre.", "The Almoravid period reshaped political and religious life in the western Maghreb and connected Saharan, North African and Iberian histories."),
          kingdomTopic("Almohad Caliphate", "Morocco, much of the Maghreb and parts of al-Andalus", "c. 1121–1269", "The Almohad movement arose among Masmuda Amazigh communities in the High Atlas and replaced Almoravid rule across much of the western Islamic world. Its rulers established a powerful caliphal state centred in Morocco.", "Almohad architecture, scholarship, administration and political history left a lasting mark on North Africa and the western Mediterranean."),
          kingdomTopic("Fatimid Caliphate", "Initially Ifriqiya in present-day Tunisia; later Egypt and parts of North Africa and the eastern Mediterranean", "909–1171", "The Fatimid dynasty established a Shi'a Ismaili caliphate in Ifriqiya before conquering Egypt in 969 and founding Cairo as its capital. At different times its authority extended across substantial parts of North Africa and beyond.", "Cairo's foundation, al-Azhar's early history, monumental architecture and the dynasty's political and intellectual institutions are major legacies."),
          kingdomTopic("Marinid Sultanate", "Morocco and, at different times, parts of the western Maghreb", "c. 1244–1465", "The Marinids, a Zenata Amazigh dynasty, established a sultanate in Morocco after the decline of Almohad power. Fez became a major centre of government, learning and architecture.", "Marinid madrasas, urban building and the political history of medieval Morocco remain significant."),
          kingdomTopic("Hafsid Sultanate", "Ifriqiya, centred on Tunis in present-day Tunisia", "1229–1574", "The Hafsids emerged from the political fragmentation of the Almohad empire and ruled Ifriqiya from Tunis. Their state participated in Mediterranean commerce and diplomacy while exercising changing levels of authority over the region.", "Hafsid Tunis was an important centre of scholarship, trade, architecture and diplomacy in the medieval Mediterranean."),
          kingdomTopic("Mamluk Sultanate of Egypt", "Egypt and, at various times, the Levant and parts of the Red Sea region", "1250–1517", "The Mamluk sultanate was ruled by military elites of enslaved-soldier origins who established a durable state based in Cairo. It became a major power in the eastern Mediterranean and defended Egypt and the Levant against Mongol and Crusader forces.", "Mamluk architecture, commercial networks, military institutions and Cairo's role as a centre of Islamic scholarship are enduring historical legacies."),
          kingdomTopic("Zagwe Dynasty", "Ethiopian highlands, especially the Lasta region", "Approximately 10th–1270", "The Zagwe dynasty ruled a highland Christian kingdom before the rise of the Solomonic dynasty. Its chronology and relationship to earlier Aksumite traditions remain subjects of historical study.", "The rock-hewn churches of Lalibela, associated with Zagwe ruler Lalibela, are among the most remarkable achievements of medieval Ethiopian architecture."),
          kingdomTopic("Sultanate of Ifat", "Eastern Ethiopian highlands and the Horn of Africa", "c. 13th–early 15th centuries", "Ifat was a Muslim sultanate in the Horn of Africa whose rulers competed and negotiated with neighbouring Christian Ethiopian kingdoms. Its territory and influence shifted over time.", "Ifat's history is important for understanding Muslim state formation, trade and political interaction in the medieval Horn of Africa."),
          kingdomTopic("Adal Sultanate", "Horn of Africa, centred at different times in the Somali-Ethiopian lowlands", "c. 14th–16th centuries", "Adal was a Muslim sultanate that became a major regional power under rulers including Ahmad ibn Ibrahim al-Ghazi. Its conflicts and diplomacy with the Ethiopian Christian kingdom reshaped the Horn in the sixteenth century.", "Adal's history reflects the region's connected Muslim and Christian polities, trade networks and complex political relationships."),
          kingdomTopic("Kilwa Sultanate", "Swahili coast, centred on Kilwa Kisiwani in present-day Tanzania", "c. 10th–16th centuries", "Kilwa became one of the most influential Swahili coastal states, with authority and commercial influence extending along parts of the East African coast. Its prosperity was tied to Indian Ocean trade, including gold from the southern interior.", "Kilwa's stone architecture, mosques, urban remains and maritime connections illuminate the history of Swahili civilisation and Indian Ocean commerce."),
          kingdomTopic("Ajuran Sultanate", "Southern Somalia and parts of the Horn of Africa", "c. 13th–17th centuries", "The Ajuran state was a major Somali-led sultanate associated with the inter-riverine region and parts of the southern Somali coast. It developed systems of political authority, taxation and water management.", "Its history, hydraulic works and commercial links are important to the study of precolonial state formation in the Horn of Africa."),
          kingdomTopic("Funj Sultanate of Sennar", "Central Sudan, along the Blue Nile", "1504–1821", "The Funj sultanate, also known as the Sultanate of Sennar, governed a large area of the central Sudanese Nile valley. It developed a courtly state with changing relations among Funj rulers, Arab groups and Muslim scholars.", "Sennar's political and religious history shaped the central Sudan region before its conquest by Ottoman-Egyptian forces in 1821."),
          kingdomTopic("Sultanate of Darfur", "Western Sudan, centred on the Darfur region", "c. 17th century–1874; restored 1898–1916", "The Fur sultanate developed into a major state in western Sudan, with its authority linked to trade routes across the Sahel and to centralised royal institutions. It was conquered by the forces of al-Zubayr Pasha in 1874, restored in 1898 and ended under Anglo-Egyptian rule in 1916.", "Darfur's sultanate history, court culture and regional trade are important to the history of western Sudan and the wider Sahel."),
          kingdomTopic("Wadai Sultanate", "Eastern Chad and adjoining parts of the central Sahel", "c. 1635–1912", "Wadai emerged as a powerful sultanate east of the Lake Chad basin. Its rulers controlled regional trade routes and built political relationships with neighbouring states, including Darfur and Borno.", "Wadai's history illustrates the importance of central Sahelian states and long-distance trade before French colonial conquest."),
          kingdomTopic("Kingdom of Cazembe", "Upper Luapula valley, mainly present-day Zambia and the Democratic Republic of the Congo", "c. 18th–19th centuries", "Cazembe was a Lunda-related kingdom established in the upper Luapula region. Its rulers governed a network of communities and trade routes linking the Central African interior with the east coast.", "Cazembe's court, diplomacy and documented encounters with Portuguese expeditions provide valuable records of nineteenth-century Central African history.")

        ]
      },
      {
        title: "Tourist sites in Africa",
        description: "Explore well-known historical, cultural and natural attractions across the African continent. The list is curated, not ranked by visitor numbers.",
        items: [
          touristSiteTopic("Great Pyramid of Giza and the Giza Plateau", "Egypt", "Giza, near Cairo", "Ancient monuments", "The pyramids and Great Sphinx form one of the world's most recognisable archaeological landscapes, built as royal funerary monuments during Egypt's Old Kingdom."),
          touristSiteTopic("Karnak Temple Complex", "Egypt", "Luxor, Upper Egypt", "Temple complex", "A vast complex of sanctuaries, pylons, halls and obelisks developed over many centuries and dedicated principally to the Theban god Amun."),
          touristSiteTopic("Valley of the Kings", "Egypt", "West bank of the Nile at Luxor", "Archaeological landscape", "The royal necropolis contains richly decorated New Kingdom tombs, including the tomb of Tutankhamun."),
          touristSiteTopic("Abu Simbel Temples", "Egypt", "Near Lake Nasser, Aswan Governorate", "Rock-cut temples", "The monumental temples commissioned by Ramesses II were cut into sandstone cliffs and later relocated to protect them from the rising waters of Lake Nasser."),
          touristSiteTopic("Medina of Marrakesh and Jemaa el-Fnaa", "Morocco", "Marrakesh", "Historic city and public square", "The historic medina brings together palaces, mosques, souks and the lively Jemaa el-Fnaa square, known for food stalls, performers and storytelling traditions."),
          touristSiteTopic("Medina of Fez", "Morocco", "Fez", "Historic city", "Fes el-Bali is a major medieval urban centre with historic madrasas, mosques, craft quarters and traditional markets."),
          touristSiteTopic("Ksar of Aït-Ben-Haddou", "Morocco", "Ouarzazate Province, southern Morocco", "Historic fortified village", "This earthen settlement on an old trans-Saharan route is known for its kasbah architecture and layered history of trade and settlement."),
          touristSiteTopic("Chefchaouen Old Town", "Morocco", "Rif Mountains, northern Morocco", "Historic town", "The mountain town is known for its blue-painted lanes, traditional architecture and setting among the Rif Mountains."),
          touristSiteTopic("Carthage Archaeological Site", "Tunisia", "Near Tunis", "Archaeological site", "The remains of ancient Carthage reveal the history of a major Phoenician-founded city and later Roman centre of the Mediterranean."),
          touristSiteTopic("El Jem Amphitheatre", "Tunisia", "El Jem, central Tunisia", "Roman monument", "One of the best-preserved Roman amphitheatres, it illustrates the scale and urban importance of Roman-era Thysdrus."),
          touristSiteTopic("Leptis Magna", "Libya", "Near Al Khums, Mediterranean coast", "Roman archaeological city", "The extensive ruins preserve monumental streets, baths, theatres and public buildings from one of the Roman Empire's most important North African cities."),
          touristSiteTopic("Tassili n'Ajjer", "Algeria", "Southeastern Sahara", "Rock art and natural landscape", "The sandstone plateau is renowned for prehistoric rock art, dramatic rock formations and evidence of ancient Saharan environments."),
          touristSiteTopic("Cape Coast Castle", "Ghana", "Cape Coast, Central Region", "Historic fort and museum", "The castle is one of the major sites associated with the transatlantic slave trade and forms part of Ghana's UNESCO-listed forts and castles."),
          touristSiteTopic("Elmina Castle", "Ghana", "Elmina, Central Region", "Historic fort", "Built by the Portuguese in 1482, Elmina Castle became a major trading post and later a place of imprisonment during the transatlantic slave trade."),
          touristSiteTopic("Kakum National Park", "Ghana", "Central Region", "Rainforest park", "The park is known for its tropical forest, guided nature trails and elevated canopy walkway, which provides a view across the forest."),
          touristSiteTopic("Osun-Osogbo Sacred Grove", "Nigeria", "Osogbo, Osun State", "Sacred forest and cultural site", "The grove is a sacred landscape dedicated to the Yoruba deity Osun, containing shrines, sculptures and a living tradition of annual pilgrimage."),
          touristSiteTopic("Olumo Rock", "Nigeria", "Abeokuta, Ogun State", "Historic rock and viewpoint", "The granite outcrop served as a refuge during nineteenth-century conflicts and is closely associated with the history of Abeokuta and the Egba people."),
          touristSiteTopic("Royal Palaces of Abomey", "Benin", "Abomey, Zou Department", "Royal palace complex", "The palaces preserve the history of the Dahomey kingdom through royal courtyards, bas-reliefs, museums and the memory of its rulers."),
          touristSiteTopic("Kunta Kinteh Island and Related Sites", "The Gambia", "River Gambia, near Juffureh", "Historic island and heritage sites", "The island and associated sites preserve evidence of the Atlantic slave trade and the history of European trading posts on the Gambia River."),
          touristSiteTopic("Island of Gorée", "Senegal", "Off the coast of Dakar", "Historic island and museum", "Gorée is a major memorial site connected to the Atlantic slave trade, with preserved colonial-era buildings and museums."),
          touristSiteTopic("Djoudj National Bird Sanctuary", "Senegal", "Senegal River delta, north of Saint-Louis", "Wetland and wildlife reserve", "The wetlands provide important habitat for migratory birds and are particularly known for large seasonal bird populations."),
          touristSiteTopic("Old Towns of Djenné", "Mali", "Djenné, Inland Niger Delta", "Historic town and architecture", "Djenné is known for its earthen architecture and the Great Mosque, a major centre of Sahelian Islamic learning and building traditions."),
          touristSiteTopic("Timbuktu", "Mali", "Northern Mali", "Historic city and manuscripts", "Timbuktu became a major centre of trans-Saharan trade and Islamic scholarship, known for its historic mosques and manuscript collections."),
          touristSiteTopic("Historic Town of Grand-Bassam", "Côte d'Ivoire", "Southeast coast, near Abidjan", "Colonial-era historic town", "Grand-Bassam preserves important examples of colonial-era architecture and the history of the coast's role in trade and administration."),
          touristSiteTopic("Koutammakou, Land of the Batammariba", "Togo", "Kara Region, northern Togo", "Cultural landscape", "The landscape is known for takienta tower-houses and the living architectural and ritual traditions of the Batammariba people."),
          touristSiteTopic("Ruins of Loropéni", "Burkina Faso", "Southwestern Burkina Faso", "Archaeological ruins", "The stone enclosure is linked to the history of gold trading networks in the region and is one of Burkina Faso's best-known archaeological sites."),
          touristSiteTopic("Mount Cameroon", "Cameroon", "Southwest Region", "Volcanic mountain and national park", "West Africa's highest mountain is known for its volcanic landscape, forest habitats and the annual Mount Cameroon Race of Hope."),
          touristSiteTopic("Foumban Royal Palace", "Cameroon", "Foumban, West Region", "Royal palace and museum", "The palace is associated with the Bamum kingdom and its rulers, and displays the region's royal history, arts and craftsmanship."),
          touristSiteTopic("Mbanza Kongo", "Angola", "Zaire Province, northwestern Angola", "Historic royal capital", "The former capital of the Kingdom of Kongo preserves the history of a major Central African state and its early connections with Europe."),
          touristSiteTopic("Kalandula Falls", "Angola", "Malanje Province", "Waterfall", "One of Africa's major waterfalls, Kalandula is set among forested landscapes on the Lucala River."),
          touristSiteTopic("Virunga National Park", "Democratic Republic of the Congo", "Eastern DRC, near the borders with Uganda and Rwanda", "National park", "Africa's oldest national park is known for mountain gorillas, active volcanoes and exceptionally diverse habitats."),
          touristSiteTopic("Kahuzi-Biega National Park", "Democratic Republic of the Congo", "South Kivu, eastern DRC", "National park", "The park protects important lowland and montane forest habitats and is a key site for the eastern lowland gorilla."),
          touristSiteTopic("Loango National Park", "Gabon", "Atlantic coast, western Gabon", "Coastal national park", "Loango is known for a rare combination of beaches, lagoons, forest and wildlife, including elephants and hippos in coastal habitats."),
          touristSiteTopic("Lopé National Park", "Gabon", "Central Gabon", "National park and archaeological landscape", "Lopé combines rainforest and savanna ecosystems with evidence of long human occupation and important wildlife habitats."),
          touristSiteTopic("Rock-Hewn Churches of Lalibela", "Ethiopia", "Lalibela, Amhara Region", "Religious and architectural site", "The group of medieval churches carved from living rock remains an active Ethiopian Orthodox pilgrimage centre and a landmark of Ethiopian architecture."),
          touristSiteTopic("Aksum Archaeological Site", "Ethiopia", "Aksum, Tigray Region", "Archaeological site", "Aksum preserves monumental stelae, royal tombs and remains of the ancient kingdom that connected the Horn of Africa with Red Sea trade."),
          touristSiteTopic("Harar Jugol", "Ethiopia", "Harar, eastern Ethiopia", "Historic walled city", "Harar is known for its walled old town, mosques, shrines, traditional houses and long history as a centre of Islamic scholarship and trade."),
          touristSiteTopic("Archaeological Sites of the Island of Meroe", "Sudan", "River Nile and Atbara region, north of Khartoum", "Ancient pyramids and temples", "Meroe was the heartland of the Kingdom of Kush and contains royal pyramids, temples and remains of the Kushite capital."),
          touristSiteTopic("Asmara: Modernist African City", "Eritrea", "Asmara, Eritrean highlands", "Historic city and architecture", "Asmara is renowned for its remarkably preserved modernist architecture, urban planning and twentieth-century buildings."),
          touristSiteTopic("Lake Assal", "Djibouti", "Danakil Depression, central-western Djibouti", "Salt lake and geological landscape", "Lake Assal lies in a striking volcanic depression and is known for its high salinity, salt flats and dramatic surrounding scenery."),
          touristSiteTopic("Laas Geel Rock Art", "Somalia (Somaliland)", "Near Hargeisa", "Rock art site", "The painted shelters preserve striking prehistoric images of cattle and human figures and are among the Horn of Africa's best-known rock art sites."),
          touristSiteTopic("Maasai Mara National Reserve", "Kenya", "Narok County, southwestern Kenya", "Wildlife reserve", "The reserve is celebrated for its savanna wildlife and its role in the annual migration of wildebeest and zebra across the Mara-Serengeti ecosystem."),
          touristSiteTopic("Lamu Old Town", "Kenya", "Lamu Island, Kenyan coast", "Historic Swahili town", "Lamu preserves Swahili architecture, narrow streets, carved doors, traditional dhow culture and centuries of Indian Ocean connections."),
          touristSiteTopic("Serengeti National Park", "Tanzania", "Northern Tanzania", "National park", "The Serengeti is internationally known for large wildlife populations and the annual movement of wildebeest, zebra and other grazing animals."),
          touristSiteTopic("Ngorongoro Conservation Area", "Tanzania", "Arusha Region, northern Tanzania", "Conservation landscape", "The Ngorongoro Crater and surrounding highlands combine exceptional wildlife, volcanic scenery and long human history."),
          touristSiteTopic("Stone Town of Zanzibar", "Tanzania", "Zanzibar City, Unguja Island", "Historic Swahili town", "Stone Town reflects centuries of African, Arab, Indian and European exchange through its architecture, markets, mosques and seafaring history."),
          touristSiteTopic("Mount Kilimanjaro", "Tanzania", "Kilimanjaro Region, northeastern Tanzania", "Mountain and national park", "Africa's highest mountain is a major trekking destination with ecological zones from cultivated foothills to alpine landscapes."),
          touristSiteTopic("Bwindi Impenetrable National Park", "Uganda", "Southwestern Uganda", "Forest national park", "Bwindi protects one of the most important habitats for endangered mountain gorillas and is known for guided gorilla tracking."),
          touristSiteTopic("Murchison Falls National Park", "Uganda", "Northwestern Uganda", "National park and waterfall", "The Nile is forced through a narrow rocky gorge before plunging into the river below, creating one of Uganda's best-known natural attractions."),
          touristSiteTopic("Volcanoes National Park", "Rwanda", "Northwestern Rwanda", "Mountain national park", "The Virunga volcano slopes protect mountain gorillas and golden monkeys and are a major destination for guided conservation tourism."),
          touristSiteTopic("Kigali Genocide Memorial", "Rwanda", "Kigali", "Memorial and museum", "The memorial honours victims of the 1994 genocide against the Tutsi and provides educational exhibits on the genocide and its history."),
          touristSiteTopic("Lake Malawi National Park", "Malawi", "Southern end of Lake Malawi", "Freshwater lake and national park", "The park protects a remarkable diversity of freshwater fish and lake habitats, alongside islands and clear-water scenery."),
          touristSiteTopic("Avenue of the Baobabs", "Madagascar", "Near Morondava, western Madagascar", "Natural landscape", "The iconic dirt road is lined with ancient baobab trees and is one of Madagascar's most photographed landscapes."),
          touristSiteTopic("Tsingy de Bemaraha", "Madagascar", "Melaky Region, western Madagascar", "Limestone karst reserve", "The sharp limestone pinnacles, caves and forests form a dramatic landscape with specialised wildlife and challenging walking routes."),
          touristSiteTopic("Vallée de Mai Nature Reserve", "Seychelles", "Praslin Island", "Nature reserve", "This palm forest is famous for the coco de mer and rare endemic species, within a protected UNESCO-listed ecosystem."),
          touristSiteTopic("Anse Source d'Argent", "Seychelles", "La Digue Island", "Beach and coastal landscape", "The beach is renowned for its granite boulders, shallow turquoise water and distinctive tropical coastal scenery."),
          touristSiteTopic("Le Morne Cultural Landscape", "Mauritius", "Le Morne Peninsula, southwest Mauritius", "Mountain and heritage landscape", "Le Morne Brabant is associated with the history of enslaved people who sought refuge on the mountain and has become a powerful symbol of freedom and remembrance."),
          touristSiteTopic("Okavango Delta", "Botswana", "Northwestern Botswana", "Inland delta and wildlife landscape", "The vast inland delta supports exceptional wildlife and seasonal waterways within the Kalahari and is one of Africa's best-known safari destinations."),
          touristSiteTopic("Chobe National Park", "Botswana", "Northern Botswana", "National park", "Chobe is famous for large elephant herds and wildlife viewing along the Chobe River."),
          touristSiteTopic("Sossusvlei and Deadvlei", "Namibia", "Namib-Naukluft National Park", "Desert landscape", "The high red dunes and fossilised camelthorn trees of Deadvlei create one of the most recognisable landscapes in the Namib Desert."),
          touristSiteTopic("Etosha National Park", "Namibia", "Northern Namibia", "National park", "Etosha's salt pan and surrounding waterholes attract elephants, lions, rhinos and other wildlife, making it a leading safari destination."),
          touristSiteTopic("Table Mountain", "South Africa", "Cape Town, Western Cape", "Mountain and national park", "The flat-topped mountain overlooks Cape Town and is known for hiking, biodiversity and panoramic views of the city and coastline."),
          touristSiteTopic("Robben Island", "South Africa", "Table Bay, near Cape Town", "Historic prison and museum", "The island was used as a prison during apartheid and is closely associated with Nelson Mandela and South Africa's struggle for democracy."),
          touristSiteTopic("Kruger National Park", "South Africa", "Limpopo and Mpumalanga provinces", "National park", "One of Africa's best-known wildlife reserves, Kruger protects large populations of iconic mammals and extensive savanna ecosystems."),
          touristSiteTopic("Cradle of Humankind", "South Africa", "Gauteng Province, northwest of Johannesburg", "Palaeoanthropological landscape", "The fossil-bearing caves have produced important evidence about human evolution and early hominin history."),
          touristSiteTopic("Victoria Falls (Mosi-oa-Tunya)", "Zambia and Zimbabwe", "Zambezi River on the Zambia-Zimbabwe border", "Waterfall and national park", "One of the world's most spectacular waterfalls, known locally as Mosi-oa-Tunya, the Smoke that Thunders, with viewpoints on both sides of the border."),
          touristSiteTopic("Great Zimbabwe National Monument", "Zimbabwe", "Masvingo Province", "Archaeological and historic site", "The monumental dry-stone enclosures were the centre of a major Shona-speaking state and provide evidence of sophisticated architecture and regional trade."),
          touristSiteTopic("Hwange National Park", "Zimbabwe", "Western Zimbabwe", "National park", "Zimbabwe's largest national park is known for elephants, large mammal populations and broad savanna and woodland habitats."),
          touristSiteTopic("South Luangwa National Park", "Zambia", "Eastern Zambia", "National park", "The Luangwa Valley is a celebrated wildlife destination known for walking safaris, river habitats and large animal populations."),
          touristSiteTopic("Island of Mozambique", "Mozambique", "Nampula Province, northern Mozambique", "Historic island town", "The island preserves Swahili, Arab, Indian and Portuguese influences through its forts, religious buildings and historic waterfront architecture."),
          touristSiteTopic("Bazaruto Archipelago", "Mozambique", "Inhambane Province, southeastern coast", "Marine national park and islands", "The protected islands and coral reefs are known for clear water, marine life, dugongs, dolphins and opportunities for diving and sailing."),
          touristSiteTopic("Maletsunyane Falls", "Lesotho", "Near Semonkong, Maseru District", "Waterfall", "The high waterfall drops into a dramatic gorge in Lesotho's mountain landscape and is known for hiking and adventure activities."),
          touristSiteTopic("Mantenga Cultural Village and Nature Reserve", "Eswatini", "Ezulwini Valley", "Cultural and nature attraction", "The site introduces visitors to aspects of Swazi homestead life, dance and cultural performance, alongside a protected natural area and waterfall.")
        ]
      }
    ],
    sources: [
      { name: "UNESCO Intangible Cultural Heritage", scope: "Documented cultural practices, performance traditions and community heritage", type: "International cultural heritage reference", url: "https://ich.unesco.org/" },
      { name: "Routledge Ethnographic Survey of Africa", scope: "Ethnographic studies covering history, language, cultural features, social organisation and livelihoods", type: "Ethnographic reference collection", url: "https://www.routledge.com/" },
      { name: "National Museums of Kenya", scope: "Museum documentation of Kenyan communities, music, instruments and cultural heritage", type: "National museum reference", url: "https://museums.or.ke/" },
      { name: "South African History Online", scope: "Historical and cultural records about communities and social history in southern Africa", type: "Historical reference", url: "https://sahistory.org.za/" }
    ],
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
    slug: "it-innovation", title: "Info Services", icon: Globe2,
    summary: "Get reliable information and professional guidance for important personal, educational, travel and business decisions, with written reports or documents prepared when needed.",
    purpose: "Amineva Global Info Services helps individuals and organisations make better-informed decisions. Whether you need clarity about an opportunity, want to understand an agreement, are planning a move abroad or need information you already have checked, we provide clear information and professional advisory support. Depending on your request, we can explain the information directly or prepare it in a well-organised written document or report.",
    sections: [
      { title: "Career & Education", description: "Make informed choices about career opportunities, education options and your next steps.", items: [topic("Career opportunities and education pathways", "Get clear information and professional guidance to help you understand opportunities, compare pathways and decide on practical next steps.", ["Which opportunities or pathways fit my goals?", "What requirements and options should I understand?", "Would a written summary or report help me compare my choices?"])] },
      { title: "Business Information", description: "Understand opportunities, markets and the factors that can shape business decisions.", items: [topic("Business opportunities and market decisions", "Get information and advisory support on business opportunities, market entry, competitors, products and expansion, with a written report where required.", ["What opportunity or market should I understand?", "What should I know about competitors and products?", "What information would support an expansion or market-entry decision?"])] },
      { title: "Contracts & Communication", description: "Understand responsibilities and practical considerations before agreements or transactions.", items: [topic("Agreements, responsibilities and communication", "Get help understanding important terms, responsibilities and practical considerations before entering an agreement or business transaction.", ["What responsibilities should I understand before committing?", "Which practical terms or conditions need clarification?", "Would a written document help set out the key considerations?"])] },
      { title: "Travel & Relocation", description: "Get destination-specific information when planning to travel, study, work or relocate internationally.", items: [topic("Destination information and relocation planning", "Understand destination-specific requirements, opportunities and practical considerations for international travel, study, work or relocation.", ["What should I know about my intended destination?", "Which requirements and practical arrangements should I check?", "Would a destination report help me prepare?"])] },
      { title: "Info and Reports Verification", description: "Have information, documents, reports, claims or business details independently checked before relying on them.", items: [topic("Independent information and report verification", "We check information and documents through source checks, cross-referencing and evidence-based assessment, then explain what can and cannot be confirmed.", ["Which claims or details need checking?", "Can the information be traced to dependable sources?", "What evidence supports the conclusion?"])] },
    ],
    sources: [
      { name: "UNESCO — Media and Information Literacy", scope: "Learning resources on accessing, evaluating and using information responsibly", type: "International education and information-literacy guidance", url: "https://www.unesco.org/en/media-information-literacy" },
      { name: "UK Office for Statistics Regulation", scope: "Guidance on trustworthy, high-quality and publicly useful statistics", type: "Official statistics oversight body", url: "https://osr.statisticsauthority.gov.uk/" },
      { name: "OECD Data", scope: "Country and cross-country statistical datasets with published indicators and metadata", type: "International statistical reference", url: "https://data.oecd.org/" },
    ],
    product: { label: "Visit Info Services", href: "https://info.amineva.com/", introduction: "Continue to the main Info Services site to explore the service and take the next step with your request." },
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
    product: { label: "Visit Inventra", href: "https://stock.amineva.com", introduction: "When you are ready to put stronger business-management practices into action, continue to Inventra." },
  },
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
    product: { label: "Visit Sikasɛm", href: "https://ops.amineva.com", introduction: "When you are ready to put these financial practices into everyday operations, continue to Sikasɛm." },
  },
  {
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
    product: { label: "Visit AgroClimate", href: "https://agro.amineva.com", introduction: "When you are ready to take the next step in applying this knowledge to agricultural activities, continue to AgroClimate." },
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

  {
    slug: "regulatory-risk-discovery", title: "Regulatory Risk Discovery", icon: ShieldCheck,
    summary: "Discover regulatory obligations, changes, enforcement signals and compliance risks that are difficult to track across sectors and jurisdictions.",
    purpose: "This area organises regulatory information that is often scattered across legislation, regulator notices, gazettes, circulars, enforcement releases and technical guidance. It helps users identify which rules may apply, what has changed, who is affected and where the original authority publishes the requirement. Regulatory information is jurisdiction-specific and time-sensitive. A topic guide is a starting point for investigation, not a legal determination that a particular obligation applies to every organisation.",
    sections: [
      { title: "Regulatory obligations and applicability", description: "Identify the authority, regulated activity, affected organisation and exact legal instrument before treating a requirement as applicable.", items: [
        topic("Sector-specific regulatory obligations", "Map the laws, licences, permits, standards, reporting duties and regulator guidance that may apply to a defined sector and activity.", ["Which country and subnational jurisdiction govern the activity?", "Which regulator supervises this sector and which activities fall within its remit?", "What law, regulation, directive or licence condition creates the obligation?", "Does the rule apply to this organisation's size, legal form, activity or operating status?"]),
        topic("Licensing, permits and operating conditions", "Identify approvals required before an activity begins and the conditions that must continue to be met while operating.", ["Is a licence, permit, registration or prior approval required?", "Which authority receives and decides the application?", "What evidence, inspection or professional qualification is required?", "What conditions, renewal dates and change-notification duties attach to the approval?"]),
        topic("Regulatory reporting and statutory deadlines", "Investigate recurring submissions, returns, disclosures, inspections and notification deadlines, including the prescribed format and submission channel.", ["Who must submit the report and for what reporting period?", "What is the exact deadline and how is it calculated?", "Which official form, portal or filing address is prescribed?", "What proof of submission and escalation route should be retained?"]),
        topic("Regulatory changes and transition periods", "Track amendments, new instruments, commencement dates, transitional provisions and implementation guidance that can change an organisation's obligations.", ["What instrument changed and what provisions were amended or repealed?", "When was it published and when does it take effect?", "Are existing operators given a transition or grace period?", "Has the regulator published implementation guidance or clarifications?"]),
        topic("Regulatory jurisdiction and cross-border activity", "Understand how obligations differ when an organisation operates across countries, regions, free zones or regulated markets.", ["Where is the entity incorporated and where does it actually operate?", "Where are customers, employees, assets and regulated activities located?", "Do multiple regulators or overlapping regimes apply?", "Which local counsel or authority should confirm conflicts and cross-border duties?"]),
      ]},
      { title: "Risk signals, enforcement and compliance failures", description: "Find and interpret official notices, enforcement actions, sanctions and recurring compliance issues without confusing allegations with final findings.", items: [
        topic("Enforcement notices and regulatory actions", "Locate official warnings, directives, administrative actions, licence suspensions, penalties and published enforcement outcomes.", ["Which regulator issued the notice and under what authority?", "Is it a warning, proposed action, interim order or final decision?", "Which entity, conduct, dates and legal provisions are identified?", "Can the original notice and any appeal or later update be located?"]),
        topic("Compliance failures and common breach patterns", "Compare documented enforcement cases and regulator guidance to understand recurring failures in a sector and the controls intended to prevent them.", ["What specific conduct or omission was found to breach a rule?", "Was the finding final, admitted, appealed or disputed?", "What control or reporting failure contributed to the outcome?", "What preventive evidence would demonstrate that a similar risk is being managed?"]),
        topic("Sanctions, restrictions and disqualification", "Investigate official sanctions lists, restricted activities, disqualified persons, market restrictions and the legal effect and scope of each entry.", ["Which official body maintains the list and what is its legal basis?", "What identifiers and effective dates are supplied?", "Does the restriction apply to a person, entity, product, transaction or territory?", "How are delisting, appeal, expiry and false-positive checks handled?"]),
        topic("Regulatory investigations and public decisions", "Find published investigation reports, tribunal decisions, regulator determinations and reasons for decisions that explain how rules are applied.", ["Is the document an investigation report, decision, settlement or court judgment?", "Which facts were established and which remain allegations?", "What legal test or interpretation did the authority apply?", "Has the decision been appealed, stayed, varied or superseded?"]),
        topic("Compliance risk assessment and control mapping", "Translate identified obligations into owners, evidence, operating controls, review intervals and escalation paths.", ["What event could cause non-compliance and what would the impact be?", "Who owns the obligation and who independently checks it?", "What record proves that the control operated on time?", "How are overdue actions, exceptions and rule changes escalated?"]),
      ]},
      { title: "Regulatory intelligence and evidence tracking", description: "Build a traceable view of what is known, where it came from, when it was checked and what remains uncertain.", items: [
        topic("Regulatory registers and obligation inventories", "Structure a register of applicable instruments, obligations, owners, evidence, deadlines and review dates for a defined entity or activity.", ["Is each entry linked to the original legal instrument or official notice?", "Are applicability assumptions and exclusions documented?", "Does every obligation have an accountable owner and evidence requirement?", "When must the register be reviewed after a change or regulator notice?"]),
        topic("Official gazettes, circulars and regulator publications", "Find primary regulatory materials that may be published separately from easy-to-find summaries or commercial commentary.", ["Which official gazette, regulator repository or government portal publishes the material?", "Can the issue number, publication date and document identifier be recorded?", "Is the document complete and is there a later correction or replacement?", "Can the source be accessed without relying on a third-party summary?"]),
        topic("Regulatory alerts and change monitoring", "Define a repeatable method for monitoring official sources and recording material changes without presenting an unverified headline as a confirmed legal update.", ["Which official source pages, feeds or gazettes should be monitored?", "What terms, instruments, sectors and jurisdictions are in scope?", "Who verifies the original document and assesses its impact?", "How are alerts corrected when an item is withdrawn or superseded?"]),
        topic("Regulatory data gaps and unresolved questions", "Make missing documents, ambiguous requirements, conflicting guidance and unconfirmed dates visible instead of filling gaps with assumptions.", ["Which part of the obligation cannot yet be verified?", "Do official sources conflict or use unclear language?", "Has the authority been asked for clarification?", "What decision should be paused until the uncertainty is resolved?"]),
      ]},
    ],
    sources: [
      { name: "World Bank Business Ready", scope: "Comparative evidence on the regulatory framework and public services affecting businesses; country and topic coverage must be checked", type: "International comparative research", url: "https://www.worldbank.org/en/businessready" },
      { name: "OECD Regulatory Policy", scope: "Regulatory governance, impact assessment, consultation and evaluation guidance", type: "International policy reference", url: "https://www.oecd.org/en/topics/sub-issues/regulatory-policy.html" },
      { name: "UN Treaty Collection", scope: "Official status and texts of treaties deposited with the United Nations; not a substitute for domestic implementing law", type: "Official treaty repository", url: "https://treaties.un.org/" },
    ],
  },
  {
    slug: "commercial-law", title: "Commercial Law", icon: Landmark,
    summary: "Explore commercial and business law, practical company procedures, intellectual property, commercial disputes and published case decisions.",
    purpose: "This area brings together commercial law and the practical legal matters businesses encounter, including registration, company obligations, contracts, trade, intellectual property, regulation and disputes. It combines legislation and official guidance with carefully reviewed case decisions so that users can understand both the rules and how courts or authorities have applied them. Every legal item must state its jurisdiction and source date. International instruments and model laws do not automatically become domestic law unless adopted or otherwise applicable. This is general legal information, not individual legal advice.",
    sections: [
      { title: "Contracts and commercial relationships", description: "Understand the formation, interpretation, performance and termination of business agreements.", items: [
        topic("Commercial contract formation", "Investigate offer, acceptance, consideration or other local requirements, authority to contract, electronic contracting and the evidence needed to establish an agreement.", ["Which jurisdiction's law governs formation?", "Were the parties legally capable and authorised to contract?", "What communications show offer, acceptance and agreed terms?", "Are signatures, witnesses, stamping or electronic-form requirements applicable?"]),
        topic("Contract terms, representations and warranties", "Examine express and implied terms, representations, warranties, conditions, exclusions and the documents that form part of a commercial agreement.", ["Which terms are expressly written and which may be implied by law?", "Are product, service, quality, delivery and payment obligations measurable?", "Do disclaimers or limitation clauses comply with applicable law?", "Which schedules, policies or referenced documents are incorporated?"]),
        topic("Breach, remedies and contract termination", "Understand the consequences of non-performance, defective performance, delay, repudiation and lawful termination.", ["What obligation was allegedly breached and what evidence supports it?", "Does the contract require notice, cure periods or escalation first?", "Which remedies may be available under the governing law?", "Are damages, specific performance, termination or restitution subject to limits?"]),
        topic("Agency, distribution and commercial representation", "Investigate the legal relationship between principals, agents, distributors, franchisees and representatives, including authority and liability.", ["Is the relationship agency, distribution, franchise, employment or another arrangement?", "What authority may the representative exercise on behalf of the principal?", "Who bears responsibility for statements, orders and customer obligations?", "What termination, territory, exclusivity and commission rules apply?"]),
        topic("Electronic commerce and digital transactions", "Explore legal requirements for online sales, electronic records, digital signatures, consumer notices, platform terms and cross-border digital transactions.", ["Are electronic records and signatures recognised in the relevant jurisdiction?", "What disclosures and consumer protections apply to online transactions?", "Where are the seller, customer, platform and data located?", "Which rules govern electronic evidence, payments and record retention?"]),
      ]},
      { title: "Trade, supply and business transactions", description: "Investigate the legal structure of buying, selling, financing, transporting and delivering goods and services.", items: [
        topic("Sale of goods and supply agreements", "Understand ownership transfer, delivery, inspection, acceptance, risk of loss, quality obligations and remedies in goods transactions.", ["Which law governs the sale and where does delivery occur?", "When do title and risk pass between the parties?", "What inspection, rejection and notice periods apply?", "Which remedies apply to defective, late or incomplete delivery?"]),
        topic("International trade terms and delivery responsibilities", "Research the allocation of delivery costs, risks, insurance, export and import responsibilities under agreed trade terms. Confirm the exact edition and named place used.", ["Which edition of the agreed trade terms is incorporated?", "What exact named place or port is specified?", "Who arranges transport, insurance, export and import clearance?", "Do the contract, shipping documents and actual delivery route align?"]),
        topic("Letters of credit and trade finance", "Investigate documentary credit arrangements, bank roles, documentary requirements, discrepancies and the rules incorporated into the instrument.", ["Which bank issues, advises or confirms the credit?", "Which documentary rules and version are incorporated?", "What documents, presentation period and expiry apply?", "How are discrepancies, amendments and payment refusal handled?"]),
        topic("Secured transactions and commercial guarantees", "Explore security interests, charges, pledges, guarantees and registration or priority rules used to support commercial obligations.", ["What asset or obligation is secured and who owns it?", "What form and registration steps create an enforceable security right?", "How is priority determined against competing creditors?", "What enforcement process and notice protections apply?"]),
        topic("Insolvency, restructuring and creditor rights", "Understand the legal processes that apply when a business cannot pay debts, including restructuring, administration, liquidation and creditor claims.", ["Which insolvency regime applies to the debtor and its assets?", "What events trigger formal proceedings or director duties?", "How are secured, preferential and unsecured claims treated?", "Which transactions may be challenged and what are the filing deadlines?"]),
      ]},
      { title: "Company, competition and intellectual property law", description: "Investigate legal rights and duties affecting business entities, markets, brands, inventions and creative works.", items: [
        topic("Directors, shareholders and corporate duties", "Research the duties, powers, conflicts, decision rights and remedies that govern company directors, shareholders and officers.", ["Which company law and constitutional documents apply?", "What duties of care, loyalty, disclosure and good faith are recognised?", "How are conflicts of interest declared and approved?", "What remedies exist for oppression, derivative claims or breach of duty?"]),
        topic("Competition and antitrust law", "Understand rules addressing cartels, abuse of dominance, mergers, restrictive agreements and unfair market conduct.", ["Which competition authority has jurisdiction over the conduct?", "What market definition and evidence are relevant?", "Are notification or approval thresholds triggered?", "What conduct is prohibited and what exemptions or defences may apply?"]),
        topic("Intellectual property in commercial activity", "Investigate how trademarks, patents, copyright, designs, trade secrets and licensing arrangements protect commercial assets.", ["Which rights can protect the relevant name, invention, work or design?", "Where must the right be registered or enforced?", "Who owns work created by employees, contractors or partners?", "What licence scope, territory, duration and permitted use are agreed?"]),
        topic("Commercial confidentiality and trade secrets", "Understand protection of confidential business information, non-disclosure arrangements, employee access and lawful use of trade secrets.", ["Does the information qualify for protection under the applicable law?", "What reasonable steps preserve confidentiality?", "Who may access or disclose the information and for what purpose?", "What evidence would establish misuse or unauthorised disclosure?"]),
        topic("Consumer protection and unfair commercial practices", "Explore rules governing product information, advertising, pricing, warranties, refunds, unfair terms and consumer complaints.", ["Is the buyer a consumer or acting for business purposes?", "Which mandatory disclosures and product standards apply?", "Are advertising claims and pricing representations substantiated?", "What complaint, refund, recall or enforcement route is available?"]),
      ]},
      { title: "Dispute resolution and legal research", description: "Find the governing rules, decisions and procedures for resolving commercial disagreements.", items: [
        topic("Commercial litigation and court procedure", "Identify the correct court, jurisdictional basis, filing requirements, limitation periods and procedural stages for a commercial claim.", ["Which court or tribunal can hear the dispute?", "Where did the cause of action arise and where are the parties located?", "What limitation period and pre-action steps apply?", "What evidence, pleadings and remedies are required?"]),
        topic("Commercial arbitration and mediation", "Investigate arbitration agreements, institutional or ad hoc rules, seat, governing law, interim measures and recognition or enforcement.", ["Is there a valid written arbitration agreement?", "What seat, institution, rules, language and number of arbitrators apply?", "Which courts may grant interim relief or supervise the process?", "How is an award recognised and enforced where assets are located?"]),
        topic("Commercial judgments and case-law research", "Locate and interpret judgments that clarify commercial statutes, contract principles and business disputes.", ["Is the judgment from a court with binding or persuasive authority?", "What legal issue and material facts did the court decide?", "Which parts are the holding and which are commentary or obiter?", "Has the decision been appealed, distinguished or overruled?"]),
        topic("Cross-border commercial law and governing law", "Understand choice of law, jurisdiction clauses, service of process and enforcement issues in transactions involving more than one country.", ["Which law governs the contract and which court has jurisdiction?", "Are the clauses exclusive, non-exclusive or ambiguous?", "Where must notices be served and where are assets located?", "Will a judgment or award be recognised in the enforcement country?"]),
      ]},
      { title: "Business case decisions and outcomes", description: "Study published decisions involving business transactions, company obligations, commercial disputes and public authorities. Each case entry distinguishes the court's order from arguments, dissenting opinions and later developments.", items: [
        topic("Reading commercial and business judgments", "Understand the parties, material facts, legal questions, applicable instruments, court reasoning and final orders in a published decision. A case summary should link to the judgment and identify the court and decision date.", ["Which court or tribunal issued the decision, and on what date?", "What material facts did the court accept as established?", "Which legal questions did it decide, and which issues were left open?", "What orders or remedies were actually granted?"]),
        topic("Settlements, consent orders and final judgments", "Distinguish a negotiated settlement, consent order, withdrawal, dismissal, administrative determination and judgment after trial. These outcomes are not interchangeable and may have different legal effects.", ["Was the matter decided after a hearing, settled by agreement or withdrawn?", "Was the settlement recorded as a consent judgment or order?", "Which parties and issues are covered by the outcome?", "Does the published record state whether the decision is final or subject to appeal?"]),
        topic("Appeals, dissenting opinions and later treatment", "Track whether a decision was affirmed, varied, reversed, stayed, appealed or distinguished. Record separate majority and dissenting reasoning without presenting a dissent as the court's binding order.", ["Was an appeal filed and what court decided it?", "Was the original order stayed, varied, reversed or affirmed?", "Is a passage part of the majority holding or a separate opinion?", "Has a later statute, regulation or judgment changed how the decision should be applied?"]),
        topic("Practical lessons from business disputes", "Extract carefully bounded lessons about contracting, records, company duties, tax administration and dispute procedures without turning one case into a universal rule.", ["Which facts made the outcome specific to this dispute?", "What contract, filing, notice or evidence was important?", "What should a business record or check differently?", "What legal advice or current official guidance may still be needed?"])
      ]},
      { title: "Starting and registering a business", description: "Understand entity choices, registration steps, official requirements and the legal effect of registration.", items: [
        topic("Choosing a business structure", "Compare sole proprietorships, partnerships, companies, limited liability forms and other recognised structures using the law of the selected jurisdiction.", ["Which entity forms are legally available in this jurisdiction?", "How do liability, ownership, taxation and continuity differ?", "Are there minimum capital, residency or director requirements?", "Which professional or sector approvals may be needed in addition to registration?"]),
        topic("Business name search and reservation", "Find the official process for checking name availability, applying for reservation and understanding restricted or protected names.", ["Which registry maintains the authoritative name database?", "Are similar, misleading, restricted or regulated words prohibited?", "How long does a reservation remain valid?", "What official fee, evidence and renewal process apply at the time of checking?"]),
        topic("Company and business registration procedure", "Create a step-by-step route from choosing an entity to submitting forms, paying verified fees and receiving the official registration evidence.", ["Which authority registers this entity type?", "What forms, declarations and supporting documents are required?", "Must documents be witnessed, certified, notarised or submitted electronically?", "What official receipt, certificate or registration number confirms completion?"]),
        topic("Ownership, directors and beneficial ownership disclosures", "Investigate who must be disclosed as an owner, shareholder, partner, director, officer or beneficial owner and how the information is filed.", ["Which persons meet the legal definition of beneficial owner or controller?", "What identity, address and ownership evidence is required?", "What disclosure thresholds and filing deadlines apply?", "How are changes, trusts, nominees or complex ownership structures treated?"]),
        topic("Post-registration tax and operational setup", "Identify separate tax, social security, local authority, employment and sector registrations that may be required after entity registration.", ["Which tax identification or taxpayer registration is required?", "Are local permits, workplace registrations or sector licences separate?", "What employer or social security registrations apply when hiring?", "Which activities may not begin until additional approval is obtained?"]),
      ]},
      { title: "Maintaining and updating a registered entity", description: "Find the required process for keeping official entity information accurate and meeting recurring statutory obligations.", items: [
        topic("Annual returns and periodic statutory filings", "Explain who must file, the reporting period, due date, required information, submission channel and evidence of filing for the selected jurisdiction and entity type.", ["Is an annual return required for this entity type?", "What period and due date apply, including any anniversary-based deadline?", "What declarations, financial statements or ownership details must accompany it?", "What official proof confirms acceptance and what happens if the filing is late?"]),
        topic("Renewing business certificates, licences and permits", "Investigate certificate and permit renewal procedures, including renewal windows, forms, supporting documents, verified fees and official payment channels.", ["Which certificate, licence or permit is expiring and who issued it?", "When should renewal begin and what is the exact deadline?", "Which documents, inspections, tax clearances or declarations are required?", "What official fee and payment method are currently published, and how is renewal confirmed?"]),
        topic("Changing directors, shareholders or ownership", "Find the legal and registry steps for appointing or removing directors, transferring shares, changing partners or recording a change of control.", ["What approval, resolution, consent or transfer instrument is required?", "Which registry forms and supporting identity documents must be filed?", "What deadline applies after the change takes effect?", "Are tax, beneficial ownership, sector licence or lender notifications also required?"]),
        topic("Updating registered address and business details", "Understand how to update a registered office, principal place of business, contact details, business activity or other official particulars.", ["Which changes must be notified to the registry and which to other authorities?", "What evidence of the new address or activity is accepted?", "Must the change be approved before it takes effect?", "What filing confirmation and updated certificate or extract should be retained?"]),
        topic("Changing business name, constitution or legal form", "Research the approvals, resolutions, filings and consequences involved in changing an entity's registered name, constitution or legal form.", ["What member, partner or regulator approval is required?", "Which forms, resolutions and amended constitutional documents must be submitted?", "When does the change legally take effect?", "Which contracts, tax records, bank accounts and licences need updating afterwards?"]),
      ]},
      { title: "Compliance, records and closure", description: "Understand ongoing duties, penalties, official recordkeeping and lawful business closure.", items: [
        topic("Business recordkeeping and statutory registers", "Identify records an entity must maintain, who may inspect them, how long they must be retained and where they must be kept.", ["Which registers, minutes, accounts and ownership records are mandatory?", "Can the records be maintained electronically and what safeguards apply?", "Who has inspection or access rights?", "What retention period and backup requirements apply?"]),
        topic("Late filings, penalties and restoration", "Investigate consequences of missed returns, expired certificates, inaccurate disclosures and administrative removal, including routes to remedy or restore status.", ["What penalty or enforcement provision applies to the missed duty?", "Does the authority issue a notice or provide a cure period?", "Can the entity be struck off, suspended or lose good standing?", "What procedure, fee and evidence are required to regularise or restore the entity?"]),
        topic("Tax and statutory administration calendar", "Build a jurisdiction-specific calendar of recurring tax, employment, company registry and sector filings, with the responsible authority and official source for each item.", ["Which obligations apply to this entity's activities and size?", "What dates, reporting periods and payment deadlines are prescribed?", "Are deadlines affected by weekends, public holidays or extensions?", "Who owns each filing and what evidence confirms submission and payment?"]),
        topic("Voluntary business closure and deregistration", "Explain the official steps for ceasing operations, settling obligations, notifying authorities and applying for dissolution, strike-off or deregistration.", ["Which closure route applies to this entity and its solvency status?", "What member or partner resolutions and notices are required?", "Must tax, employees, creditors, licences and outstanding filings be settled first?", "Which authority confirms dissolution and what records must be retained afterwards?"]),
        topic("Official company searches and status verification", "Show how to obtain authoritative registry extracts, certificates, status checks and filed-document copies before entering a transaction.", ["Which official registry provides the current entity record?", "What identifiers and search options are available?", "Does the result confirm active status, directors, address and filing history?", "What is the record's retrieval date and what information is not certified by the search?"]),
      ]},
      { title: "Procedure research and jurisdiction comparison", description: "Make official procedures easier to follow while keeping country-specific differences explicit.", items: [
        topic("Step-by-step authority procedure guides", "Turn official instructions into a clear sequence with eligibility, prerequisites, forms, documents, fees, channels, deadlines and completion evidence.", ["What is the exact procedure and which entity type does it cover?", "What must be completed before starting the application?", "Which steps are online, in person or handled by another authority?", "What official document proves each stage has been completed?"]),
        topic("Required documents and certification rules", "Identify the precise documents accepted for a filing, including identity evidence, resolutions, tax clearances, translations, certification and notarisation.", ["Which documents are mandatory and which are conditional?", "Must originals, certified copies or electronic records be supplied?", "Are translations or notarisation required and by whom?", "How recent must supporting documents be?"]),
        topic("Official fees, processing times and service channels", "Record published charges, payment channels, service standards and contact routes only when an official authority confirms them.", ["Is the fee listed in an official schedule and what date applies?", "Are there separate filing, search, penalty or expedited-service charges?", "Is a processing time guaranteed, estimated or merely typical?", "How can an applicant verify payment and avoid unofficial intermediaries?"]),
        topic("Comparing business administration across jurisdictions", "Compare equivalent procedures across selected countries without implying that one country's rules apply in another.", ["Are the entity types and procedures legally equivalent?", "Which authority, forms, fees, documents and deadlines differ?", "What source date and verification method supports each jurisdiction entry?", "Which differences require local professional confirmation?"]),
      ]},
    ],
    sources: [
      { name: "UNCITRAL", scope: "International trade law conventions, model laws, legislative guides and case-law materials", type: "United Nations legal source", url: "https://uncitral.un.org/" },
      { name: "UNIDROIT", scope: "International commercial contract principles and instruments; applicability depends on adoption or contractual use", type: "International legal research", url: "https://www.unidroit.org/" },
      { name: "WIPO", scope: "Intellectual property treaties, country profiles and legal resources", type: "Official international IP source", url: "https://www.wipo.int/" },
      { name: "WTO Legal Texts", scope: "Multilateral trade agreements and official legal texts for WTO members", type: "Official international trade source", url: "https://www.wto.org/english/docs_e/legal_e/legal_e.htm" },
      { name: "Ghana Judiciary e-Judgment Portal", scope: "Published Ghana court judgments and case-law search across court jurisdictions; access conditions may apply", type: "Official judiciary source", url: "https://ejudgment.judicial.gov.gh/" },
      { name: "GhaLII", scope: "Digitally accessible Ghana legislation and judicial decisions; confirm current status against official publications", type: "Legal information repository", url: "https://ghalii.org/" },
      { name: "Ghana Revenue Authority – Legal Cases", scope: "Published court decisions involving GRA and tax administration", type: "Official tax authority case index", url: "https://gra.gov.gh/legal-cases/" },
      { name: "Office of the Registrar of Companies", scope: "Official company and business-name registration, filings and registry guidance in Ghana", type: "Official company registry", url: "https://orc.gov.gh/" },
      { name: "Copyright Office of Ghana", scope: "Official copyright administration and public guidance; check current legislation and amendments before relying on a legal position", type: "Official intellectual-property authority", url: "https://www.copyright.gov.gh/" }
    ],
  },
  {
    slug: "investigations-archive", title: "Investigations Archive", icon: Search,
    summary: "Explore publicly published investigative journalism and completed official investigations, with the methods, reported findings, responses and documented outcomes kept distinct.",
    purpose: "A curated reference archive of investigations whose reports or findings have been made public. The first release focuses on published investigative journalism and completed official investigations for which a public report or authoritative record exists. It excludes active confidential investigations, unpublished case files, private-source material and unsupported allegations. Each entry attributes findings to the publisher or investigating authority and distinguishes reported allegations, official findings, court decisions and later developments. The archive is not a complete list of every investigation ever conducted.",
    sections: [
      { title: "Published investigative journalism", description: "Review published investigations and documentaries, including undercover reporting where the methods and findings are publicly documented.", items: [
        topic("Investigative reporting and public-interest journalism", "Study how a published investigation identifies a public-interest question, gathers and checks documents or testimony, seeks responses and presents its findings. Attribute claims to the journalist or publisher until independently established.", ["What question did the investigation set out to examine?", "Which documents, interviews, observations or records did the publisher say it used?", "Were the affected people or organisations given a meaningful opportunity to respond?", "Which claims were independently corroborated and which remain allegations?"]),
        topic("Undercover and covert reporting", "Understand publicly disclosed undercover methods at a high level, including their stated purpose, corroboration and ethical scrutiny. Do not reproduce operational details that could expose sources, vulnerable people or sensitive techniques.", ["Why did the publisher say covert methods were necessary?", "What evidence was gathered and how was it independently checked?", "What privacy, consent, safety or public-interest concerns were considered?", "What did the publisher disclose about limitations or editorial review?"]),
        topic("Responses, corrections and follow-up", "Record responses from named parties, corrections or clarifications by the publisher, institutional action and subsequent reporting as separate dated events.", ["What response did the subject or institution provide?", "Did the publisher correct or qualify any material claim?", "What action followed publication, and which authority confirmed it?", "Are later developments independently sourced and dated?"])
      ]},
      { title: "Completed official investigations", description: "Include only investigations by public authorities where the investigation has been concluded and findings or a final report have been publicly released.", items: [
        topic("Published reports by regulators and public authorities", "Read final investigative reports or official summaries from regulators, anti-corruption bodies, commissions and other public institutions. Identify the issuing authority and the scope of its mandate.", ["Does the issuing body have authority to investigate this subject?", "Does the authority describe the investigation as concluded or the case as closed?", "Is the full report public, or is the entry based only on an official summary?", "What findings, administrative action or referral does the authority expressly record?"]),
        topic("Public inquiries and commissions of inquiry", "Study public inquiry reports, terms of reference, evidence summaries, findings and recommendations. A recommendation is not itself a criminal conviction or court order.", ["What question or terms of reference governed the inquiry?", "Which evidence and witness material did the report rely on?", "Which findings are factual conclusions and which are recommendations?", "What response or implementation action followed?"]),
        topic("Official investigation outcomes and reforms", "Record completed investigations that led to recovery, administrative measures, policy changes, referrals or other documented outcomes. State who confirmed each result.", ["Was money recovered, property preserved or an administrative sanction imposed?", "Was a person charged, acquitted, convicted or not prosecuted?", "Did the authority record institutional or procedural reforms?", "Which outcomes remain under appeal or in separate proceedings?"])
      ]},
      { title: "Evidence, findings and outcome literacy", description: "Learn to separate what was alleged, what an investigation reported, what a court decided and what remains unresolved.", items: [
        topic("Allegations, evidence and established findings", "Distinguish a complaint, an allegation, evidence gathered, an investigator's conclusion and a finding made by a court or other authorised decision-maker.", ["Who made the original allegation and what evidence was supplied?", "What did investigators say they substantiated, and under which mandate?", "Did the subject dispute the account or provide a response?", "Has a court made a finding, or is the entry only reporting an investigation?"]),
        topic("Chronology and source verification", "Build a dated timeline using original reports, official releases, court records and subsequent corrections. Keep the original publication separate from later legal or administrative events.", ["What is the date of the original investigation or report?", "Which primary source confirms each milestone?", "Is a later event a new investigation, an appeal or a separate proceeding?", "When was the latest source checked, and what remains unknown?"])
      ]}
    ],
    sources: [
      { name: "Office of the Special Prosecutor – Published Impact and Investigation Reports", scope: "Officially published investigation summaries, completed-case indicators and special reports; distinguish ongoing prosecutions from closed investigations", type: "Official public investigation source", url: "https://osp.gov.gh/media_center/impact" },
      { name: "International Consortium of Investigative Journalists", scope: "Catalogue of published cross-border investigative journalism projects", type: "Investigative journalism publisher", url: "https://www.icij.org/investigations/" }
    ],
  },
  {
    slug: "production-industry-intelligence", title: "Production & Industry Intelligence", icon: Warehouse,
    summary: "Discover how industries produce, source, process and move goods, with evidence on capacity, inputs, standards and regional supply chains.",
    purpose: "Production and industry information is often distributed across statistical agencies, industrial associations, technical standards bodies, research institutes, company disclosures, trade data and field reports. This area organises that evidence to help users understand what is produced in a region, how production works, which inputs and technologies are required, where supply chains depend on imports or local suppliers, and what constraints or emerging developments matter. Production statistics must identify their year, unit, geography, industry classification and source. Estimates and company claims must not be presented as verified national capacity.",
    sections: [
      { title: "Industry structure and production geography", description: "Understand what is produced, where industrial activity is concentrated and how output and capacity are measured.", items: [
        topic("Manufacturing by country, region and industrial cluster", "Map manufacturing activities by country, region, industrial zone and cluster, distinguishing registered facilities from operational production sites.", ["Which products and industry classifications are represented?", "Where are the facilities located and are they currently operational?", "Is the evidence from a census, registry, survey, company disclosure or field verification?", "What year and geographic coverage does the map represent?"]),
        topic("Production statistics and industrial capacity", "Compare output, installed capacity, utilisation, employment and productivity using consistent definitions and reporting periods.", ["Is the figure actual output, installed capacity or estimated potential?", "What unit, reference year and industry classification are used?", "Does the source cover formal firms, all establishments or selected respondents?", "Can the result be compared across regions without mixing definitions?"]),
        topic("Industrial zones, parks and production facilities", "Investigate the location, infrastructure, services, occupancy, target sectors and operating status of industrial parks and production zones.", ["Who owns or manages the zone and what official information is available?", "Which utilities, transport links and shared facilities are operational?", "Which firms are active tenants rather than announced or planned projects?", "What land, lease, licensing and environmental conditions apply?"]),
        topic("Emerging and declining industries", "Track industries expanding, contracting, relocating or changing technology using production, investment, employment and trade evidence.", ["What measurable evidence indicates growth or decline?", "Is the change temporary, cyclical or structural?", "Which regions, subsectors and firm sizes are affected?", "What alternative explanations or data limitations should be considered?"]),
        topic("Industrial investment and project tracking", "Follow announced, financed, under-construction, commissioned and operational industrial projects as distinct stages.", ["Who is the project sponsor and what primary announcement exists?", "Has financing or construction been independently confirmed?", "Has the facility begun commercial production and at what scale?", "What evidence supports each reported project milestone?"]),
      ]},
      { title: "Raw materials, inputs and sourcing", description: "Identify the materials, suppliers, origin, quality requirements and risks behind industrial production.", items: [
        topic("Raw material availability and regional sourcing", "Investigate the availability, production volumes, quality, seasonality and geographic origin of key industrial raw materials.", ["Which materials are required and what grades or specifications are acceptable?", "Are local production volumes sufficient and consistently available?", "Which regions or countries supply the material and how is origin verified?", "What seasonal, environmental or market constraints affect supply?"]),
        topic("Supplier and input-market intelligence", "Build evidence-backed profiles of producers, processors, distributors and import channels for critical production inputs.", ["Is the supplier a producer, authorised distributor, broker or importer?", "Can business identity, facility, product and operating status be verified?", "What capacity, quality certifications and delivery coverage are evidenced?", "Are prices, minimum orders and lead times dated and independently confirmed?"]),
        topic("Import dependence and supply-chain exposure", "Assess reliance on imported materials, components, machinery and intermediate goods, including country concentration and transport dependencies.", ["Which inputs are imported and under what trade classification?", "What share of supply comes from each origin and what period is measured?", "Which ports, routes, currencies or border processes create exposure?", "What alternative local or international sources are technically viable?"]),
        topic("Material specifications, grades and quality", "Understand technical specifications, testing methods, acceptable tolerances, handling and traceability for materials used in production.", ["Which standard or customer specification defines acceptable quality?", "What tests, sampling and certificates are required?", "Who performs the test and is the laboratory accredited for it?", "How are rejected, substituted or non-conforming materials handled?"]),
        topic("Input price and availability trends", "Track published price series, import values, quotations and supply notices while separating indicative market prices from actual transaction prices.", ["What product grade, unit, location and delivery basis does the price describe?", "What date and source support the observation?", "Does the series represent a market index, customs value or supplier quote?", "What exchange-rate, freight, tax and seasonality effects are excluded?"]),
      ]},
      { title: "Production processes, equipment and technology", description: "Understand how raw materials become finished products and what machinery, skills, utilities and process controls are required.", items: [
        topic("Industrial production processes and process flow", "Break a production line into stages, inputs, transformations, outputs, by-products, quality checks and critical process conditions.", ["What are the main production stages and their sequence?", "Which inputs, temperatures, pressures, times or process conditions matter?", "Where do waste, yield loss, bottlenecks or quality defects occur?", "Which technical source or facility evidence supports the process description?"]),
        topic("Machinery, equipment and technology requirements", "Identify machinery classes, production-line configurations, tooling, automation and support equipment required for a defined product and capacity.", ["What output capacity and product specification is the equipment designed for?", "Which utilities, installation conditions and operator skills are required?", "Are maintenance, spare parts, calibration and after-sales support available locally?", "What evidence supports equipment performance and lifecycle cost claims?"]),
        topic("Factory utilities, infrastructure and site requirements", "Investigate electricity, water, fuel, waste treatment, storage, logistics, building and safety requirements for an industrial facility.", ["What are the process-specific utility loads and reliability needs?", "Are grid supply, backup power and water sources adequate?", "What zoning, building, environmental and fire approvals are required?", "How do site access, drainage, transport and waste handling affect operations?"]),
        topic("Production cost, yield and productivity", "Understand material consumption, labour, energy, maintenance, overhead, yield, scrap and throughput when estimating production economics.", ["What is the unit of output and which costs are included?", "What input quantities and yield assumptions are supported by evidence?", "Are labour, energy, maintenance and downtime costs current and location-specific?", "How sensitive is unit cost to capacity utilisation and input-price changes?"]),
        topic("Industrial automation and technology adoption", "Explore automation, process monitoring, industrial software, robotics, sensors and digital quality systems used to improve production.", ["Which production problem is the technology intended to solve?", "What integration, connectivity, skills and maintenance are required?", "Is the claimed productivity improvement supported by a measured case?", "What cybersecurity, safety and workforce implications arise?"]),
      ]},
      { title: "Standards, supply chains and industrial development", description: "Investigate product conformity, logistics, value chains, workforce needs and changes shaping industrial competitiveness.", items: [
        topic("Product standards, certification and conformity assessment", "Identify mandatory technical regulations, voluntary standards, testing, inspection and certification routes for a product and destination market.", ["Which national regulator or standards body sets mandatory requirements?", "Which standard edition and product scope apply?", "Who may test, inspect or certify conformity?", "Are requirements different for domestic sale, export and specific customer contracts?"]),
        topic("Quality management and production assurance", "Understand quality systems, process controls, traceability, corrective actions and audit evidence used in industrial production.", ["Which quality standard or customer requirement applies?", "How are incoming materials, in-process checks and finished goods controlled?", "Can a batch be traced to inputs, process records and test results?", "How are non-conformities, recalls and corrective actions documented?"]),
        topic("Industrial supply-chain and logistics mapping", "Map suppliers, processors, manufacturers, warehouses, transport routes, ports and customers to identify dependencies and bottlenecks.", ["Which organisations perform each stage of the value chain?", "What evidence confirms each link is active and commercially connected?", "Where do transport, storage, border or infrastructure delays occur?", "Which critical nodes have limited alternatives?"]),
        topic("Local value addition and import substitution", "Assess opportunities to process local materials, deepen supplier networks and replace imports where quality, scale and economics support it.", ["Which imported product or intermediate input could potentially be produced locally?", "Are local raw materials, skills, utilities and technology sufficient?", "What quality, scale, cost and regulatory barriers must be resolved?", "Does the evidence demonstrate viable demand and competitive production economics?"]),
        topic("Industrial skills, workforce and technical capability", "Investigate the occupations, technical skills, training systems and specialist services needed to operate and maintain production facilities.", ["Which roles are essential for the process and equipment?", "What qualifications, licences or practical competencies are required?", "Are skills available locally or dependent on external specialists?", "What training, apprenticeship or technology-transfer arrangements exist?"]),
        topic("Environmental, safety and resource efficiency", "Explore industrial environmental permits, occupational safety, energy and water efficiency, emissions, waste and circular production practices.", ["Which environmental and workplace safety rules apply to the facility?", "What permits, monitoring and reporting are required?", "How are emissions, effluent, waste and hazardous materials measured and controlled?", "What evidence demonstrates resource-efficiency or sustainability claims?"]),
      ]},
    ],
    sources: [
      { name: "UNIDO Statistics", scope: "International industrial statistics, manufacturing value added, employment and related indicators; check country, year and methodology", type: "Official international industrial statistics", url: "https://stat.unido.org/" },
      { name: "UNIDO Industrial Analytics Platform", scope: "Industrial development, manufacturing and country-level analytical resources", type: "International industry research", url: "https://iap.unido.org/" },
      { name: "UN Comtrade", scope: "Officially reported international merchandise trade data; trade values do not directly establish domestic production capacity", type: "Official international trade statistics", url: "https://comtradeplus.un.org/" },
      { name: "International Organization for Standardization", scope: "International standards catalogue and standards-development information; full standards may require purchase", type: "International standards body", url: "https://www.iso.org/standards.html" },
    ],
  },
];


/* Keep these as independent discovery areas in the main area list.
   Culture and Tradition contains only cultural communities and festivals. */
const cultureCategory = categories.find(category => category.slug === "culture-and-tradition");
const kingdomsSection = cultureCategory?.sections.find(section => section.title === "Major African kingdoms");
const touristSitesSection = cultureCategory?.sections.find(section => section.title === "Tourist sites in Africa");

if (cultureCategory) {
  cultureCategory.sections = cultureCategory.sections.filter(
    section => section.title !== "Major African kingdoms" && section.title !== "Tourist sites in Africa"
  );
}

if (kingdomsSection) {
  categories.push({
    slug: "african-kingdoms",
    title: "African Kingdoms",
    icon: Landmark,
    summary: "Explore major historical kingdoms and royal states that shaped the African continent.",
    purpose: "Discover major African kingdoms, their histories, political systems and enduring legacies.",
    sections: [kingdomsSection],
    sources: [],
  });
}

if (touristSitesSection) {
  categories.push({
    slug: "african-tourist-sites",
    title: "African Tourist Sites",
    icon: Plane,
    summary: "Discover notable historical, cultural and natural attractions across Africa.",
    purpose: "Explore notable destinations across Africa, including heritage sites, landscapes and natural attractions.",
    sections: [touristSitesSection],
    sources: [],
  });
}

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

function ResearchPanel({ initialQuery = "", autoSearch = false }: { initialQuery?: string; autoSearch?: boolean }) {
  const [query, setQuery] = useState(initialQuery);
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retrievedAt, setRetrievedAt] = useState("");
  const [openingDocument, setOpeningDocument] = useState<string | null>(null);
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
      const [external, approved] = await Promise.all([
        searchResearchRepositories(clean, controller.signal),
        searchVerifiedDiscoveryRecords(clean, controller.signal),
      ]);
      if (activeRequest.current !== controller) return;

      const merged = new Map<string, ResearchRecord>();
      for (const record of [...external.records, ...approved]) {
        const key = record.doi
          ? "doi:" + record.doi.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
          : "title:" + record.title.toLocaleLowerCase().trim();
        const current = merged.get(key);
        if (!current || record.verificationStatus === "editorially-verified") {
          merged.set(key, current ? {
            ...record,
            sources: Array.from(new Set([...record.sources, ...current.sources])),
          } : record);
        } else {
          current.sources = Array.from(new Set([...current.sources, ...record.sources]));
        }
      }
      const combined = Array.from(merged.values()).sort((a, b) =>
        Number(b.verificationStatus === "editorially-verified") - Number(a.verificationStatus === "editorially-verified")
        || (b.year || 0) - (a.year || 0)
      );
      setRecords(combined);
      setRetrievedAt(new Date().toISOString());
      if (!combined.length) {
        const failures = external.sourceErrors;
        setError(failures.length
          ? "The connected repositories could not return records. " + failures.map(item => item.source + ": " + item.message).join(" · ")
          : "No matching publication records were returned. Try different search terms.");
      } else if (external.sourceErrors.length) {
        setError("Some external repositories were unavailable: " + external.sourceErrors.map(item => item.source).join(", ") + ". Results from available sources and the approved library are shown.");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError" && activeRequest.current === controller) {
        setError(err?.message || "The research repositories could not be reached. Check the connection and try again.");
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (autoSearch && initialQuery.trim().length >= 3) void runSearch();
  }, [initialQuery, autoSearch]);

  const openStoredDocument = async (record: ResearchRecord) => {
    if (!record.libraryRecordId) return;
    setOpeningDocument(record.id);
    try {
      const url = await getVerifiedDiscoveryDocumentUrl(record.libraryRecordId);
      if (!url) throw new Error("This document is not approved for public access.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.message || "The document could not be opened.");
    } finally {
      setOpeningDocument(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4 text-primary" /> Research publication search</div><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Search scholarly indexes, institutional repositories and publications reviewed for the Amineva library. Repository metadata remains a discovery lead until its original source and rights are checked.</p></div>
        <Badge variant="outline">Research indexes · University repositories · Reviewed library</Badge>
      </div>
      <form onSubmit={runSearch} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Search a subject, question or research topic" aria-label="Search research publications" />
        <Button type="submit" disabled={loading || query.trim().length < 3} className="sm:min-w-32">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Search</Button>
      </form>
      {error && <p role="status" className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{error}</p>}
      {retrievedAt && <p className="mt-3 text-[11px] text-muted-foreground">Retrieved {new Date(retrievedAt).toLocaleString()} · Retrieval time is not publication time.</p>}
      {records.length > 0 && <div className="mt-4 space-y-3">
        {records.map((record, index) => <article key={record.id || record.doi || record.url || index} className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{record.year || "Publication year not supplied"}</Badge><span className="text-[11px] text-muted-foreground">{record.type}</span><Badge variant={record.verificationStatus === "editorially-verified" ? "default" : "outline"}>{record.verificationStatus === "editorially-verified" ? "Editorially verified" : "Metadata only"}</Badge></div>
          <h3 className="mt-2 font-semibold leading-6">{record.title}</h3>
          {(record.authors || record.journal || record.publisher) && <p className="mt-1 text-xs leading-5 text-muted-foreground">{[record.authors, record.journal, record.publisher].filter(Boolean).join(" · ")}</p>}
          {record.doi && <p className="mt-1 text-[11px] text-muted-foreground">DOI: <span className="font-mono">{record.doi}</span></p>}
          {record.sources?.length > 0 && <p className="mt-1 text-[10px] text-muted-foreground">Indexed by: {record.sources.join(", ")}{record.openAccess === true ? " · Open-access copy identified" : record.openAccess === false ? " · Open access not confirmed" : ""}</p>}
          {record.subjects?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{record.subjects.slice(0, 5).map(subject => <Badge key={subject} variant="secondary" className="text-[9px]">{subject}</Badge>)}</div>}
          {record.abstract && <p className="mt-3 text-sm leading-6 text-muted-foreground">{record.abstract}{record.abstract.length >= 900 ? "…" : ""}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            {record.url && <a href={record.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary underline underline-offset-2">Open original record</a>}
            {record.fullTextUrl && record.openAccess && <a href={record.fullTextUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary underline underline-offset-2">Open full text</a>}
            {record.hasStoredDocument && record.libraryRecordId && <button type="button" onClick={() => void openStoredDocument(record)} disabled={openingDocument === record.id} className="text-xs font-medium text-primary underline underline-offset-2 disabled:opacity-50">{openingDocument === record.id ? "Preparing document…" : "Open approved document"}</button>}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{record.verificationStatus === "editorially-verified" ? "Verification status: editorially reviewed. " : "Verification status: metadata only. "}{record.verificationNote} Check the original source, version, corrections, licence and access conditions before relying on or reusing a work.</p>
        </article>)}
      </div>}
      <p className="mt-4 text-[11px] text-muted-foreground">Search results are discovery leads, not endorsements. Editorial approval confirms that the record passed the library's publication and rights checks; it does not guarantee that every research conclusion is correct.</p>
    </section>
  );
}

function DateAndIncidents() {
  const [date, setDate] = useState("");
  const [region, setRegion] = useState<"Africa first" | "Africa" | "International" | "all">("Africa first");
  const [category, setCategory] = useState("all");
  const [events, setEvents] = useState<DateIncidentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedDate, setSearchedDate] = useState("");

  const runDateSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!date) return;
    setLoading(true);
    setError("");
    setEvents([]);
    setSearchedDate(date);
    try {
      const records = await searchDateIncidents({ date, region, category });
      setEvents(records);
    } catch (err: any) {
      setError(err?.message || "The historical search could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
        <h2 className="text-2xl font-bold tracking-tight">Date &amp; Incidents</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Discover the events, incidents and historical milestones that shaped our world.</p>
        <form onSubmit={runDateSearch} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="space-y-1.5 text-xs font-medium">Choose the exact date
            <Input type="date" value={date} onChange={event => setDate(event.target.value)} required />
          </label>
          <label className="space-y-1.5 text-xs font-medium">Geographical coverage
            <select value={region} onChange={event => setRegion(event.target.value as typeof region)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Africa first">Africa first · then worldwide</option><option value="Africa">Africa only</option><option value="International">International only</option><option value="all">All regions</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium">Incident category
            <select value={category} onChange={event => setCategory(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All prominent events</option><option value="politics and independence">Politics &amp; independence</option><option value="wars and conflicts">Wars &amp; conflicts</option><option value="assassinations and coups">Assassinations &amp; coups</option><option value="disasters and accidents">Disasters &amp; accidents</option><option value="court decisions and law">Court decisions &amp; law</option><option value="science and discoveries">Science &amp; discoveries</option><option value="culture and sports">Culture &amp; sports</option>
            </select>
          </label>
          <div className="flex items-end"><Button type="submit" disabled={!date || loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching</> : <><Search className="mr-2 h-4 w-4" />Discover</>}</Button></div>
        </form>
      </div>

      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {searchedDate && !loading && !error && <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-semibold">Prominent events on {dateLabel}</h3><p className="text-xs text-muted-foreground">{events.length} documented events for this exact date</p></div></div>
        {events.length ? <div className="grid gap-3 md:grid-cols-2">{events.map((item,index) => <article key={item.occurrenceDate + item.title + index} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge variant={item.region === "Africa" ? "default" : "secondary"}>{item.region}</Badge><Badge variant="outline">{item.category}</Badge><Badge variant={item.prominence === "major" ? "default" : "outline"}>{item.prominence === "major" ? "Major event" : "Notable event"}</Badge></div>
          <h4 className="mt-3 font-semibold leading-5">{item.title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{item.occurrenceDate} · {item.location}</p>
          <p className="mt-3 text-sm leading-6">{item.summary}</p>
          {item.significance && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.significance}</p>}
          {item.people.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Key people: {item.people.join(", ")}</p>}
          {item.dateBasis && <p className="mt-2 text-xs leading-5 text-muted-foreground">Date evidence: {item.dateBasis}</p>}
          {item.caveat && <p className="mt-2 rounded-md bg-muted/60 p-2 text-xs leading-5 text-muted-foreground">Historical note: {item.caveat}</p>}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />{item.confidence === "corroborated" ? "Multiple-source support" : item.confidence === "contested" ? "Contested historical account" : "Single-source support"}</div>
          <div className="mt-4 border-t border-border pt-3"><p className="mb-2 text-xs font-semibold">Historical sources</p><ul className="space-y-2">{item.sources.map((source,sourceIndex) => <li key={source.url + sourceIndex}><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">{source.name} <ExternalLink className="h-3 w-3" /></a>{source.publisher && <p className="text-[11px] text-muted-foreground">{source.publisher}{source.sourceType ? " · " + source.sourceType : ""}</p>}{source.supports && <p className="text-[11px] text-muted-foreground">{source.supports}</p>}</li>)}</ul></div>
        </article>)}</div> : <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No well-sourced prominent events were found for this exact date.</p>}
      </div>}
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


type KnowledgePathway = {
  id: string;
  situation: string;
  subject: string;
  materialType: string;
  title: string;
  creator: string;
  why: string;
  perspective?: string;
  keywords?: string[];
  audience?: string;
};

const KNOWLEDGE_PATHWAYS: KnowledgePathway[] = [
  { id: "online-business", subject: "Business and income", situation: "You want to understand how an online business can create real value and income instead of chasing quick-money promises.", materialType: "Book", title: "The Personal MBA", creator: "Josh Kaufman", why: "Introduces core business disciplines such as value creation, marketing, sales, finance and systems in accessible language." },
  { id: "entrepreneurship", subject: "Business and income", situation: "You have an idea and want to understand how to test whether people will actually pay for it before investing heavily.", materialType: "Book", title: "The Mom Test", creator: "Rob Fitzpatrick", why: "Shows how to ask customers useful questions and avoid misleading feedback when validating an idea." },
  { id: "personal-finance", subject: "Money and society", situation: "You want to understand why people make different financial decisions and how habits shape long-term financial outcomes.", materialType: "Book", title: "The Psychology of Money", creator: "Morgan Housel", why: "Explores the behavioural side of money, risk, patience and financial decision-making through short stories and examples." },
  { id: "poverty", subject: "Money and society", situation: "You want to understand poverty beyond individual choices, including the economic and institutional conditions that keep communities poor.", materialType: "Book", title: "The Bottom Billion", creator: "Paul Collier", why: "Examines several development traps affecting the world's poorest countries. Its arguments are influential but debated, so compare them with newer development research." },
  { id: "power-influence", subject: "People and influence", situation: "You want to recognise how power, influence and manipulation operate in relationships, organisations and public life.", materialType: "Book", title: "The 48 Laws of Power", creator: "Robert Greene", why: "Presents historical examples and strategic interpretations of power. Read it critically: it is not a scientific lawbook or an ethical guide." },
  { id: "psychology", subject: "People and influence", situation: "You want a clearer introduction to how people think, make judgements and sometimes reach predictable errors.", materialType: "Book", title: "Thinking, Fast and Slow", creator: "Daniel Kahneman", why: "Introduces influential research on judgement and decision-making. Some specific findings in the wider field have since been debated or revised." },
  { id: "culture", subject: "Culture and history", situation: "You want to understand how culture shapes identity, everyday behaviour, traditions and the way communities interpret the world.", materialType: "Book", title: "The Interpretation of Cultures", creator: "Clifford Geertz", why: "A foundational work in interpretive anthropology that explores how cultural meaning can be understood through close study of symbols and social life." },
  { id: "african-history", subject: "Culture and history", situation: "You want to explore African history through African-centred scholarship rather than relying on accounts that begin with colonial rule.", materialType: "Book", title: "The African Origin of Civilization: Myth or Reality", creator: "Cheikh Anta Diop", why: "Presents Diop's influential arguments about African antiquity and historical identity. Read alongside contemporary archaeological and historical scholarship, including critiques." },
  { id: "lawyer-reasoning", subject: "Law and justice", situation: "You are studying law or entering legal practice and want to strengthen the way you analyse facts, rules and arguments.", materialType: "Book", title: "Thinking Like a Lawyer", creator: "Frederick Schauer", why: "Introduces legal reasoning, rules, precedent, authority and argument. It is a conceptual introduction, not a substitute for jurisdiction-specific law." },
  { id: "constitutional-law", subject: "Law and justice", situation: "You want to understand constitutional government, the limits of public power and the protection of individual rights.", materialType: "Book", title: "Constitutionalism: A Very Short Introduction", creator: "Nick Barber", why: "Provides a concise introduction to constitutionalism and the principles that structure and limit government. Pair it with the constitution and cases of the relevant country." },
  { id: "science-thinking", subject: "Science and discovery", situation: "You want to understand how scientific knowledge develops, why accepted explanations change and how scientific revolutions happen.", materialType: "Book", title: "The Structure of Scientific Revolutions", creator: "Thomas S. Kuhn", why: "Introduces the influential idea of paradigm shifts in science. It is a philosophical and historical account, not a complete description of every scientific field." },
  { id: "scientific-method", subject: "Science and discovery", situation: "You want to become more careful about evidence, experiments, uncertainty and claims presented as scientific facts.", materialType: "Book", title: "The Demon-Haunted World", creator: "Carl Sagan", why: "Encourages sceptical inquiry and evidence-based thinking, with accessible examples of how to evaluate extraordinary claims." },
  { id: "philosophy", subject: "Philosophy and ideas", situation: "You want to begin studying philosophy and examine justice, knowledge, leadership and the good society.", materialType: "Book", title: "The Republic", creator: "Plato", why: "A foundational philosophical dialogue exploring justice, education, political order and the nature of knowledge. Different translations vary." },
  { id: "ethics", subject: "Philosophy and ideas", situation: "You want to think more carefully about what makes an action right, what people owe one another and how to live well.", materialType: "Book", title: "Nicomachean Ethics", creator: "Aristotle", why: "Explores virtue, character, practical wisdom and human flourishing. It is a foundational text, best approached with an accessible guide or commentary." },
  { id: "writing", subject: "Writing and communication", situation: "You want to become a stronger writer and communicate ideas clearly without relying on complicated language.", materialType: "Book", title: "On Writing: A Memoir of the Craft", creator: "Stephen King", why: "Combines a writer's memoir with practical advice on habits, revision, clarity and the craft of writing." },
  { id: "research", subject: "Writing and communication", situation: "You want to learn how to investigate a subject, evaluate sources and produce research that other people can check.", materialType: "Book", title: "The Craft of Research", creator: "Wayne C. Booth, Gregory G. Colomb, Joseph M. Williams, Joseph Bizup and William T. FitzGerald", why: "Guides readers through developing research questions, building arguments, using evidence and communicating findings." },
  { id: "leadership", subject: "Leadership and organisations", situation: "You have responsibility for a team and want to understand how to build trust, coordinate people and improve performance.", materialType: "Book", title: "The Effective Executive", creator: "Peter F. Drucker", why: "Focuses on contribution, time, strengths, priorities and decision-making in organisational work." },
  { id: "negotiation", subject: "Leadership and organisations", situation: "You need to negotiate an agreement while protecting important interests and maintaining a workable relationship.", materialType: "Book", title: "Getting to Yes", creator: "Roger Fisher, William Ury and Bruce Patton", why: "Introduces principled negotiation, separating people from problems and focusing on interests and options." },
  { id: "agriculture", subject: "Agriculture and environment", situation: "You want to understand how soil health, ecological processes and farm management connect to long-term food production.", materialType: "Book", title: "The Nature and Properties of Soils", creator: "Nyle C. Brady and Ray R. Weil", why: "A widely used textbook covering soil formation, physical and chemical properties, biology and management. Choose an edition appropriate to your course or needs." },
  { id: "climate", subject: "Agriculture and environment", situation: "You want to understand climate change through scientific evidence, impacts and the choices available to societies.", materialType: "Assessment report", title: "IPCC Sixth Assessment Report", creator: "Intergovernmental Panel on Climate Change (IPCC)", why: "A major international scientific assessment covering climate science, impacts, adaptation and mitigation. Use the relevant working-group report and note its publication date." },
  { id: "technology", subject: "Technology and design", situation: "You want to understand how good software is designed around real human needs rather than features alone.", materialType: "Book", title: "The Design of Everyday Things", creator: "Don Norman", why: "Explains usability, feedback, affordances and human-centred design through familiar objects and systems." },
  { id: "data-literacy", subject: "Technology and design", situation: "You want to become better at reading charts, questioning statistics and avoiding conclusions that data cannot support.", materialType: "Book", title: "Calling Bullshit: The Art of Skepticism in a Data-Driven World", creator: "Carl T. Bergstrom and Jevin D. West", why: "Shows how misleading data claims, visualisations and statistical arguments can be identified and challenged." },
  { id: "architecture", subject: "Creativity and the built world", situation: "You want to understand how buildings and cities influence human experience, movement and everyday life.", materialType: "Book", title: "A Pattern Language", creator: "Christopher Alexander, Sara Ishikawa and Murray Silverstein", why: "Presents a pattern-based approach to designing buildings and communities around recurring human needs." },
  { id: "education", subject: "Learning and human development", situation: "You want to understand how people learn and how teaching can help learners develop genuine understanding.", materialType: "Book", title: "How People Learn II: Learners, Contexts, and Cultures", creator: "National Academies of Sciences, Engineering, and Medicine", why: "Synthesises research on learning across development, culture and context. It is a research-based reference rather than a step-by-step teaching manual." },
  { id: "journalism", subject: "Society and public life", situation: "You want to understand the responsibilities of journalism and how reporting can distinguish evidence from rumour and opinion.", materialType: "Book", title: "The Elements of Journalism", creator: "Bill Kovach and Tom Rosenstiel", why: "Explains core principles of journalism, verification, independence and accountability." },
  { id: "medicine", subject: "Medicine and health", situation: "You want to understand how clinicians reason through uncertain symptoms and make difficult diagnostic decisions.", materialType: "Book", title: "How Doctors Think", creator: "Jerome Groopman", why: "Uses clinical cases to examine diagnostic reasoning and common thinking errors. It is a general-interest account, not a clinical training manual.", keywords: ["doctor", "medical", "diagnosis", "clinical reasoning"], audience: "General readers and health students" },
  { id: "public-health", subject: "Medicine and health", situation: "You want to understand how public health systems prevent disease and improve health across whole populations.", materialType: "Textbook", title: "Oxford Textbook of Global Public Health", creator: "Roger Detels, Martin Gulliford, Quarraisha Abdool Karim and Chorh Chuan Tan (editors)", why: "A broad reference covering the scope, methods and practice of public health. Check the edition and volume relevant to your area of study.", keywords: ["health systems", "epidemiology", "prevention", "population health"], audience: "Advanced students and practitioners" },
  { id: "engineering", subject: "Engineering and invention", situation: "You want to understand how engineers learn from failure and why apparently small design decisions can have major consequences.", materialType: "Book", title: "To Engineer Is Human", creator: "Henry Petroski", why: "Explores engineering design through case studies of failure, risk and improvement. It is an accessible introduction rather than a technical design standard.", keywords: ["design", "invention", "failure analysis", "civil engineering"], audience: "General readers and aspiring engineers" },
  { id: "computer-science", subject: "Technology and design", situation: "You want to understand what happens inside computers and how software represents and processes information.", materialType: "Book", title: "Code: The Hidden Language of Computer Hardware and Software", creator: "Charles Petzold", why: "Builds an intuitive explanation of computation from simple signalling systems through logic, hardware and software.", keywords: ["computers", "programming", "hardware", "software", "coding"], audience: "Beginners and curious readers" },
  { id: "economics", subject: "Money and society", situation: "You want an accessible introduction to how economists think about incentives, markets, prices and everyday decisions.", materialType: "Book", title: "The Undercover Economist", creator: "Tim Harford", why: "Uses everyday examples to explain economic concepts and how incentives shape outcomes. Treat its examples as introductions, not universal rules.", keywords: ["economics", "markets", "incentives", "business"], audience: "Beginners and general readers" },
  { id: "investing", subject: "Money and society", situation: "You want to understand the principles of analysing investments and the difference between investing and speculation.", materialType: "Book", title: "The Intelligent Investor", creator: "Benjamin Graham", why: "A classic text on value investing, margin of safety and investor behaviour. Some examples and market conditions are dated; it is educational material, not personal financial advice.", keywords: ["investment", "stocks", "shares", "value investing", "finance"], audience: "Committed beginners and intermediate readers" },
  { id: "systems-thinking", subject: "Leadership and organisations", situation: "You want to understand why complex problems persist and how feedback loops, delays and system structure influence outcomes.", materialType: "Book", title: "Thinking in Systems: A Primer", creator: "Donella H. Meadows", why: "Introduces stocks, flows, feedback and leverage points for understanding complex systems across organisations, economies and the environment.", keywords: ["systems", "complexity", "problem solving", "management"], audience: "General readers, managers and students" },
  { id: "project-management", subject: "Leadership and organisations", situation: "You want to understand how constraints, bottlenecks and coordination affect the performance of a production or service organisation.", materialType: "Book", title: "The Goal: A Process of Ongoing Improvement", creator: "Eliyahu M. Goldratt and Jeff Cox", why: "Uses a business narrative to introduce the Theory of Constraints and continuous improvement. Pair it with technical operations-management material for formal study.", keywords: ["operations", "manufacturing", "production", "bottleneck", "management"], audience: "Business owners, operations teams and students" },
  { id: "african-modern-history", subject: "Culture and history", situation: "You want to study modern African history through scholarship that examines colonialism, independence and the making of contemporary states.", materialType: "Book", title: "Africa Since 1940: The Past of the Present", creator: "Frederick Cooper", why: "Provides a scholarly account of major political, economic and social transformations in modern Africa. Use it alongside country-specific histories for local depth.", keywords: ["Africa", "African history", "colonialism", "independence"], audience: "Students and general readers" },
  { id: "cultural-anthropology", subject: "Culture and history", situation: "You want a structured introduction to how anthropologists study culture, social life, customs and differences between communities.", materialType: "Textbook", title: "Sharing Our Worlds: An Introduction to Cultural and Social Anthropology", creator: "Joy Hendry", why: "Introduces major ideas and methods in cultural and social anthropology, with examples across everyday life and societies.", keywords: ["anthropology", "culture", "society", "traditions"], audience: "Beginners and students" },
  { id: "public-administration", subject: "Society and public life", situation: "You want to understand how public policy is experienced by people who deliver government services on the ground.", materialType: "Book", title: "Street-Level Bureaucracy", creator: "Michael Lipsky", why: "Examines how frontline public workers exercise discretion under resource and workload constraints, shaping how policies are implemented in practice.", keywords: ["government", "public service", "policy", "administration"], audience: "Public policy students, civil servants and researchers" },
  { id: "environment", subject: "Agriculture and environment", situation: "You want to understand how human activities can affect ecosystems and why environmental evidence matters for public decisions.", materialType: "Book", title: "Silent Spring", creator: "Rachel Carson", why: "A landmark work that helped bring pesticide impacts and ecological risk into public debate. Read it alongside current environmental science and updated regulatory assessments.", keywords: ["ecology", "environment", "pesticides", "conservation"], audience: "General readers and environmental studies students" },
  { id: "creative-practice", subject: "Creativity and the built world", situation: "You want to develop a more deliberate creative practice and understand how ideas can be developed into finished work.", materialType: "Book", title: "The Creative Act: A Way of Being", creator: "Rick Rubin", why: "Offers reflective perspectives on attention, creative process and making art. It is a practitioner's perspective rather than a scientific textbook.", keywords: ["creativity", "art", "music", "innovation"], audience: "Artists, makers and general readers" },
  { id: "communication", subject: "Writing and communication", situation: "You want to make an idea easier to understand, remember and communicate to other people.", materialType: "Book", title: "Made to Stick: Why Some Ideas Survive and Others Die", creator: "Chip Heath and Dan Heath", why: "Explores why some messages are memorable and gives practical principles for communicating ideas clearly.", keywords: ["communication", "storytelling", "public speaking", "marketing"], audience: "Writers, educators, communicators and business teams" },
  { id: "teaching", subject: "Learning and human development", situation: "You want practical ideas for planning lessons, explaining concepts and checking whether learners have understood.", materialType: "Book", title: "Teach Like a Champion 3.0", creator: "Doug Lemov", why: "Presents classroom techniques for instruction, questioning, practice and classroom culture. Adapt techniques to learners, context and local teaching standards.", keywords: ["teaching", "education", "classroom", "instruction"], audience: "Teachers, tutors and teacher trainees" },
  { id: "advocacy", subject: "Law and justice", situation: "You want to improve the structure and clarity of legal arguments and learn how advocates present a case.", materialType: "Book", title: "Making Your Case: The Art of Persuading Judges", creator: "Antonin Scalia and Bryan A. Garner", why: "Discusses legal writing and oral advocacy, especially in the United States legal context. Local court rules, professional ethics and jurisdiction-specific law must take priority.", keywords: ["law", "advocacy", "legal writing", "litigation"], audience: "Law students and legal practitioners" },
  { id: "ghana-evolution-change", subject: "African history", situation: "You want a historical account of Ghana's political, economic and social transformation during the nineteenth and twentieth centuries.", materialType: "Book", title: "Ghana: Evolution and Change in the Nineteenth and Twentieth Centuries", creator: "A. Adu Boahen", why: "A Ghanaian historian's study of the forces and events that shaped modern Ghana.", keywords: ["Ghana", "Gold Coast", "Asante", "Adu Boahen", "national history"] },
  { id: "west-african-history-text", subject: "African history", situation: "You want a structured introduction to West African kingdoms, trade, religion, European contact and the independence era.", materialType: "Book", title: "Topics in West African History", creator: "A. Adu Boahen, J. F. Ade Ajayi and Michael Tidy", why: "A broad regional history covering pre-colonial states, trans-Saharan connections, European contact and modern political change.", keywords: ["West Africa", "Ghana", "Nigeria", "Mali", "regional history", "Adu Boahen"] },
  { id: "african-perspectives-colonialism", subject: "African history", situation: "You want to study colonialism through historical analysis by an African historian.", materialType: "Book", title: "African Perspectives on Colonialism", creator: "A. Adu Boahen", why: "Examines the character of colonial rule, African responses and the historical consequences of colonial domination.", keywords: ["colonialism", "African history", "resistance", "decolonisation", "Adu Boahen"] },
  { id: "african-history-brief", subject: "African history", situation: "You want a concise overview of African history from early societies through slavery, colonial conquest and independence.", materialType: "Book", title: "African History: A Very Short Introduction", creator: "John Parker and Richard Rathbone", why: "A compact academic introduction to the diversity of African societies and the major themes in the continent's history.", keywords: ["African history", "slavery", "colonialism", "African societies", "historical overview"] },
  { id: "njinga-angola", subject: "African history", situation: "You want to learn about the political leadership and anti-colonial resistance of Queen Njinga in seventeenth-century Angola.", materialType: "Book", title: "Njinga of Angola: Africa's Warrior Queen", creator: "Linda M. Heywood", why: "A historical study of Njinga's diplomacy, political strategy and resistance to Portuguese expansion.", keywords: ["Angola", "Njinga", "women in African history", "resistance", "Central Africa"] },
  { id: "african-history-africa-badawi", subject: "African history", situation: "You want a broad African-centred account of the continent's history, from early human history to independence.", materialType: "Book", title: "An African History of Africa", creator: "Zeinab Badawi", why: "A continent-wide narrative that draws on African voices, historical sites and scholarship to explore Africa's past.", keywords: ["African history", "African voices", "ancient Africa", "independence", "historical memory"] },
  { id: "gold-coast-asante-history", subject: "Ghanaian history", situation: "You want to explore early written accounts of the histories and traditions of the Gold Coast and Asante.", materialType: "Book", title: "The History of the Gold Coast and Asante", creator: "Carl Christian Reindorf", why: "An important nineteenth-century account by a Ghanaian historian, drawing on oral traditions and historical records. Read it critically alongside later scholarship.", keywords: ["Gold Coast", "Asante", "Ghana", "oral tradition", "Reindorf", "Akan history"] },
  { id: "thousand-years-west-africa", subject: "African history", situation: "You want to trace major changes in West African societies across a long historical period.", materialType: "Book", title: "A Thousand Years of West African History", creator: "J. F. Ade Ajayi and Ian Espie, editors", why: "A collection of historical studies that introduces the region's political, cultural and economic past.", keywords: ["West African history", "Yoruba", "trade", "empires", "African historians"] },
  { id: "beautyful-ones", subject: "African literature", situation: "You want to explore post-independence Ghana through a novel about disillusionment, public life and social expectations.", materialType: "Book", title: "The Beautyful Ones Are Not Yet Born", creator: "Ayi Kwei Armah", why: "A major Ghanaian novel examining corruption, moral compromise and the hopes surrounding independence.", keywords: ["Ghanaian literature", "Ghana", "corruption", "independence", "African novel"] },
  { id: "no-longer-at-ease", subject: "African literature", situation: "You want to examine the pressures faced by a young African professional between family expectations, public service and colonial-era institutions.", materialType: "Book", title: "No Longer at Ease", creator: "Chinua Achebe", why: "A novel about ambition, social obligation and corruption in a changing Nigerian society.", keywords: ["Nigeria", "African literature", "public service", "colonial legacy", "Chinua Achebe"] },
  { id: "half-yellow-sun", subject: "African literature", situation: "You want to understand the human experience of the Nigerian Civil War through a richly developed historical novel.", materialType: "Book", title: "Half of a Yellow Sun", creator: "Chimamanda Ngozi Adichie", why: "Follows several lives during the Biafran War and explores conflict, class, loyalty and historical memory.", keywords: ["Nigeria", "Biafra", "civil war", "African women writers", "historical fiction"] },
  { id: "purple-hibiscus", subject: "African literature", situation: "You want to explore family life, authority, religion and political change in contemporary Nigeria through fiction.", materialType: "Book", title: "Purple Hibiscus", creator: "Chimamanda Ngozi Adichie", why: "A coming-of-age novel about family power, personal freedom and the wider political climate in Nigeria.", keywords: ["Nigeria", "family", "religion", "politics", "African fiction"] },
  { id: "so-long-letter", subject: "African literature", situation: "You want to read an African woman's perspective on marriage, friendship, grief and social change.", materialType: "Book", title: "So Long a Letter", creator: "Mariama Bâ", why: "A landmark Senegalese novel in letter form, exploring women's choices, family and changing social expectations.", keywords: ["Senegal", "African women writers", "marriage", "society", "feminist literature"] },
  { id: "nervous-conditions", subject: "African literature", situation: "You want to explore education, gender, colonial power and family expectations through a young woman's experience in Zimbabwe.", materialType: "Book", title: "Nervous Conditions", creator: "Tsitsi Dangarembga", why: "A major Zimbabwean novel examining the costs and possibilities of education under colonial and patriarchal structures.", keywords: ["Zimbabwe", "education", "gender", "colonialism", "African women writers"] },
  { id: "famished-road", subject: "African literature", situation: "You want to explore a literary world where folklore, spiritual experience and modern political life meet.", materialType: "Book", title: "The Famished Road", creator: "Ben Okri", why: "A Nigerian novel blending urban life, political change and spirit-world traditions through the perspective of a spirit child.", keywords: ["Nigeria", "magical realism", "folklore", "African fiction", "urban life"] },
  { id: "grain-wheat", subject: "African literature", situation: "You want to explore betrayal, solidarity and the struggle for independence in a Kenyan community.", materialType: "Book", title: "A Grain of Wheat", creator: "Ngũgĩ wa Thiong'o", why: "A historical novel set around Kenya's independence struggle, examining memory, sacrifice and political responsibility.", keywords: ["Kenya", "Mau Mau", "independence", "African literature", "colonial resistance"] },
  { id: "gods-bits-wood", subject: "African literature", situation: "You want to understand collective action, labour struggles and colonial-era society in West Africa through fiction.", materialType: "Book", title: "God's Bits of Wood", creator: "Ousmane Sembène", why: "A novel about the 1947–48 railway strike in French West Africa and the role of workers and women in collective resistance.", keywords: ["Senegal", "Mali", "railway strike", "labour history", "African novel"] },
  { id: "anowa", subject: "African literature", situation: "You want to explore gender, tradition, marriage and social expectations through Ghanaian drama.", materialType: "Play", title: "Anowa", creator: "Ama Ata Aidoo", why: "A Ghanaian play that questions social convention and examines power, identity and the costs of conformity.", keywords: ["Ghanaian literature", "Ghana", "theatre", "gender", "Akan society"] },
  { id: "kintu", subject: "African literature", situation: "You want to explore Ugandan history, family memory and social change across several generations.", materialType: "Book", title: "Kintu", creator: "Jennifer Nansubuga Makumbi", why: "A multi-generational Ugandan novel linking family history, cultural memory and contemporary life.", keywords: ["Uganda", "African literature", "family history", "oral tradition", "contemporary fiction"] },
  { id: "death-kings-horseman", subject: "African literature", situation: "You want to examine ritual, responsibility, colonial intervention and conflicting worldviews through African theatre.", materialType: "Play", title: "Death and the King's Horseman", creator: "Wole Soyinka", why: "A landmark Nigerian play inspired by a historical event in colonial-era Oyo, exploring duty, ritual and cultural misunderstanding.", keywords: ["Nigeria", "Yoruba", "theatre", "colonialism", "African philosophy"] },
  { id: "joys-motherhood", subject: "African literature", situation: "You want to explore motherhood, women's work, family obligations and urban change in colonial-era Nigeria.", materialType: "Book", title: "The Joys of Motherhood", creator: "Buchi Emecheta", why: "A Nigerian novel examining the social expectations placed on women and the pressures of changing urban life.", keywords: ["Nigeria", "women", "motherhood", "family", "African fiction"] },
  { id: "efuru", subject: "African literature", situation: "You want to explore women's lives, marriage, economic independence and community expectations in Nigerian fiction.", materialType: "Book", title: "Efuru", creator: "Flora Nwapa", why: "An influential novel centred on an Igbo woman navigating marriage, work, family and her place in society.", keywords: ["Nigeria", "Igbo", "women writers", "African literature", "gender"] },
  { id: "song-lawino", subject: "African literature", situation: "You want to explore cultural identity, language and the encounter between local traditions and Western influence through poetry.", materialType: "Book", title: "Song of Lawino", creator: "Okot p'Bitek", why: "A celebrated Ugandan poetic work voiced by Lawino, defending cultural practices while criticising imposed standards.", keywords: ["Uganda", "poetry", "Acholi", "culture", "African literature"] },
  { id: "sleepwalking-land", subject: "African literature", situation: "You want to explore the human costs of civil war and displacement through contemporary African fiction.", materialType: "Book", title: "Sleepwalking Land", creator: "Mia Couto", why: "A Mozambican novel that uses interwoven journeys and memory to examine war, loss and survival.", keywords: ["Mozambique", "civil war", "memory", "African literature", "displacement"] },
  { id: "our-lady-nile", subject: "African literature", situation: "You want to examine social hierarchy, identity and political tension in a school setting in Rwanda.", materialType: "Book", title: "Our Lady of the Nile", creator: "Scholastique Mukasonga", why: "A Rwandan novel set at a girls' boarding school before the 1994 genocide, exploring exclusion and social divisions.", keywords: ["Rwanda", "education", "identity", "memory", "African women writers"] },
  { id: "homegoing", subject: "African literature", situation: "You want to trace the long effects of slavery and the Atlantic slave trade through connected family histories in Ghana and the diaspora.", materialType: "Book", title: "Homegoing", creator: "Yaa Gyasi", why: "A multi-generational novel following two branches of a Ghanaian family across Africa and the United States.", keywords: ["Ghana", "slavery", "diaspora", "African fiction", "family history"] },
  { id: "tradition-modernity-african", subject: "African philosophy", situation: "You want to examine how African societies can engage modern ideas while critically reflecting on inherited cultural values.", materialType: "Book", title: "Tradition and Modernity: Philosophical Reflections on the African Experience", creator: "Kwame Gyekye", why: "A Ghanaian philosopher's analysis of African cultural experience, tradition, modernity and ethical questions.", keywords: ["African philosophy", "Ghana", "Akan philosophy", "ethics", "modernity"] },
  { id: "essay-african-philosophy", subject: "African philosophy", situation: "You want to study philosophical concepts within Akan thought, including personhood, reality, ethics and the nature of knowledge.", materialType: "Book", title: "An Essay on African Philosophical Thought: The Akan Conceptual Scheme", creator: "Kwame Gyekye", why: "A detailed philosophical interpretation of Akan concepts and their relevance to African philosophical debate.", keywords: ["Akan", "Ghana", "African philosophy", "ethics", "ontology"] },
  { id: "african-philosophy-myth", subject: "African philosophy", situation: "You want to understand the debate about what counts as African philosophy and how it should be developed.", materialType: "Book", title: "African Philosophy: Myth and Reality", creator: "Paulin J. Hountondji", why: "Challenges assumptions about a single collective African worldview and argues for rigorous, critical philosophical inquiry.", keywords: ["African philosophy", "epistemology", "knowledge", "decolonisation", "philosophical debate"] },
  { id: "sage-philosophy", subject: "African philosophy", situation: "You want to explore whether and how individual thinkers in African oral traditions can contribute to systematic philosophy.", materialType: "Book", title: "Sage Philosophy: Indigenous Thinkers and Modern Debate on African Philosophy", creator: "Henry Odera Oruka", why: "Introduces the philosophical-sage project and debates about oral reasoning, individual thought and African intellectual traditions.", keywords: ["African philosophy", "Kenya", "oral traditions", "indigenous knowledge", "ethics"] },
  { id: "consciencism", subject: "African philosophy", situation: "You want to examine Kwame Nkrumah's attempt to develop a philosophical basis for African liberation and social transformation.", materialType: "Book", title: "Consciencism: Philosophy and Ideology for Decolonization", creator: "Kwame Nkrumah", why: "Presents Nkrumah's political philosophy and his argument about the intellectual foundations of African liberation and socialism.", keywords: ["Ghana", "Nkrumah", "African philosophy", "decolonisation", "Pan-African thought"] },
  { id: "african-religions-philosophy", subject: "African philosophy", situation: "You want an introduction to African religious worldviews and the ways they shape community, morality and everyday life.", materialType: "Book", title: "African Religions and Philosophy", creator: "John S. Mbiti", why: "A widely studied introduction to African religious thought and philosophy, with examples drawn from several African societies.", keywords: ["African philosophy", "religion", "ethics", "worldviews", "African societies"] },
  { id: "invention-of-africa", subject: "African philosophy", situation: "You want to examine how academic knowledge and external representations have shaped ideas about Africa and African identity.", materialType: "Book", title: "The Invention of Africa: Gnosis, Philosophy, and the Order of Knowledge", creator: "V. Y. Mudimbe", why: "A critical study of how Africa has been represented and classified through systems of knowledge and colonial discourse.", keywords: ["African philosophy", "knowledge", "colonial discourse", "identity", "African studies"] },
  { id: "african-indigenous-sciences", subject: "African science and technology", situation: "You want to study the scientific and historical dimensions of African indigenous knowledge systems.", materialType: "Book", title: "African Indigenous Knowledge and the Sciences: Journeys into the Past and Present", creator: "Gloria Emeagwali and Edward Shizha, editors", why: "Explores African indigenous knowledge in relation to science, education and contemporary knowledge systems.", keywords: ["African science", "indigenous knowledge", "technology", "education", "science history"] },
  { id: "african-indigenous-disciplines", subject: "African science and technology", situation: "You want to explore how African indigenous knowledge connects with different academic disciplines and fields of practice.", materialType: "Book", title: "African Indigenous Knowledge and the Disciplines", creator: "Gloria Emeagwali and George J. Sefa Dei, editors", why: "A collection examining the place of African indigenous knowledge across disciplines and research traditions.", keywords: ["African science", "indigenous knowledge", "African studies", "education", "research"] },
  { id: "science-technology-african-history", subject: "African science and technology", situation: "You want an historical introduction to the development of science and technology in African societies.", materialType: "Book", title: "Science and Technology in African History", creator: "Gloria Emeagwali, editor", why: "A scholarly collection on scientific and technological knowledge in African historical contexts.", keywords: ["African science", "technology history", "African invention", "indigenous technology", "history"] },
  { id: "african-cultural-astronomy", subject: "African science and technology", situation: "You want to explore how African communities have observed, interpreted and incorporated the sky into knowledge and cultural practice.", materialType: "Book", title: "African Cultural Astronomy", creator: "Jarita C. Holbrook, Johnson O. Urama and R. Thebe Medupe, editors", why: "A research collection on archaeoastronomy and ethnoastronomy in African contexts.", keywords: ["African astronomy", "astronomy", "science", "archaeology", "indigenous knowledge"] },
  { id: "medicinal-plants-africa", subject: "African science and technology", situation: "You want an academic reference on medicinal plants and traditional medicine in African settings.", materialType: "Reference book", title: "Medicinal Plants and Traditional Medicine in Africa", creator: "Abayomi Sofowora", why: "A reference on medicinal plants and traditional medicine. It is for historical and scientific study, not personal diagnosis or self-treatment.", keywords: ["African science", "botany", "medicinal plants", "ethnobotany", "traditional medicine"] },
  { id: "african-fractals", subject: "African science and technology", situation: "You want to explore mathematical patterns in African design, architecture and indigenous systems of knowledge.", materialType: "Book", title: "African Fractals: Modern Computing and Indigenous Design", creator: "Ron Eglash", why: "Examines mathematical patterns such as recursion and fractals in African design, settlement patterns and cultural practices.", keywords: ["African mathematics", "fractals", "computing", "architecture", "indigenous design"] },
  { id: "citizen-subject", subject: "African governance", situation: "You want to understand how colonial systems of administration continue to influence citizenship, local authority and democratic reform in Africa.", materialType: "Book", title: "Citizen and Subject: Contemporary Africa and the Legacy of Late Colonialism", creator: "Mahmood Mamdani", why: "A major political analysis of colonial governance and its continuing effects on post-independence African states.", keywords: ["African governance", "colonial state", "democracy", "citizenship", "political institutions"] },
  { id: "trouble-with-nigeria", subject: "African governance", situation: "You want to examine the problems of leadership, public responsibility and national development through a Nigerian writer's critique.", materialType: "Book", title: "The Trouble with Nigeria", creator: "Chinua Achebe", why: "A concise and influential critique of leadership and political culture in Nigeria, written in the early 1980s.", keywords: ["Nigeria", "African governance", "leadership", "public institutions", "politics"] },
  { id: "africa-unchained", subject: "African governance", situation: "You want to explore arguments about African development, institutional reform and the role of local initiative.", materialType: "Book", title: "Africa Unchained: The Blueprint for Africa's Future", creator: "George B. N. Ayittey", why: "Presents an argument for institutional, economic and political reforms to address development challenges in African countries.", keywords: ["African governance", "development", "institutions", "economics", "reform"] },
  { id: "indigenous-african-institutions", subject: "African governance", situation: "You want to understand the roles of traditional institutions, community organisation and local governance in African societies.", materialType: "Book", title: "Indigenous African Institutions", creator: "George B. N. Ayittey", why: "Examines traditional African institutions and their relevance to social organisation and contemporary development debates.", keywords: ["African governance", "traditional institutions", "customary law", "chieftaincy", "community"] },
  { id: "democracy-africa", subject: "African governance", situation: "You want an evidence-based overview of democratic transitions, elections and political reform across African countries.", materialType: "Book", title: "Democracy in Africa: Successes, Failures, and the Struggle for Political Reform", creator: "Nic Cheeseman", why: "Introduces the varied trajectories of democracy and political reform across the continent.", keywords: ["African governance", "democracy", "elections", "political reform", "institutions"] },
  { id: "africa-works", subject: "African governance", situation: "You want to compare critical interpretations of how informal networks and political power shape African states.", materialType: "Book", title: "Africa Works: Disorder as Political Instrument", creator: "Patrick Chabal and Jean-Pascal Daloz", why: "A debated interpretation of political order and informal power in Africa. Read alongside African scholars and country-specific research.", keywords: ["African governance", "political networks", "state", "institutions", "political analysis"] },
  { id: "africa-not-country", subject: "Contemporary African society", situation: "You want to move beyond one-dimensional portrayals of Africa and understand the continent's diversity and modern everyday life.", materialType: "Book", title: "Africa Is Not a Country: Notes on a Bright Continent", creator: "Dipo Faloyin", why: "Challenges stereotypes by exploring the variety, complexity and contemporary experiences of African societies.", keywords: ["African society", "African countries", "identity", "media representation", "contemporary Africa"] },
  { id: "triple-heritage", subject: "Contemporary African society", situation: "You want to explore how African societies have been shaped by indigenous traditions, Islam and Christianity, and European influence.", materialType: "Book", title: "The Africans: A Triple Heritage", creator: "Ali A. Mazrui", why: "A broad interpretive account of cultural, religious and historical influences on African societies.", keywords: ["African society", "culture", "religion", "identity", "African history"] },
  { id: "africas-urban-revolution", subject: "Contemporary African society", situation: "You want to understand rapid urbanisation and the opportunities and pressures facing African cities.", materialType: "Book", title: "Africa's Urban Revolution", creator: "Susan Parnell and Edgar Pieterse, editors", why: "A collection examining urban growth, planning, governance and social change in African cities.", keywords: ["African cities", "urbanisation", "housing", "planning", "urban development"] },
  { id: "urban-africa-codesria", subject: "Contemporary African society", situation: "You want to understand how people build livelihoods and negotiate social and economic power in African cities.", materialType: "Book", title: "Urban Africa: Changing Contours of Survival in the City", creator: "Abdulmaliq Simone and Abdelghani Abouhani, editors", why: "Research on everyday urban life, livelihoods, institutions and changing power relations across several African cities.", keywords: ["African cities", "urban life", "livelihoods", "informal economy", "society"] },
  { id: "visions-city-accra", subject: "Contemporary African society", situation: "You want to explore how Accra's growth affects housing, transport, institutions and the future of city life.", materialType: "Book", title: "Visions of the City: Accra in the 21st Century", creator: "Ralph Mills-Tettey and Korantema Adi-Dako, editors", why: "A Ghana-focused collection of perspectives on urban change, planning and the future of Accra.", keywords: ["Accra", "Ghana", "African cities", "urban planning", "transport", "housing"] },
  { id: "dead-aid", subject: "Contemporary African society", situation: "You want to examine arguments about foreign aid, development policy and economic independence in African countries.", materialType: "Book", title: "Dead Aid: Why Aid Is Not Working and How There Is a Better Way for Africa", creator: "Dambisa Moyo", why: "Presents a prominent critique of aid dependency. Its recommendations are contested, so compare them with development research and alternative perspectives.", keywords: ["African development", "foreign aid", "economics", "development policy", "Dambisa Moyo"] },
  { id: "business-strategy", subject: "Business and income", situation: "You want to distinguish a clear business strategy from a list of ambitions and disconnected activities.", materialType: "Book", title: "Good Strategy/Bad Strategy", creator: "Richard Rumelt", why: "Explains how to diagnose a challenge, choose a guiding policy and coordinate focused action.", keywords: ["strategy", "business planning", "competitive advantage", "management"] },
  { id: "lean-startup", subject: "Business and income", situation: "You are developing a new product and want to test important assumptions before spending too much time or money.", materialType: "Book", title: "The Lean Startup", creator: "Eric Ries", why: "Introduces experimentation, validated learning and iterative product development for uncertain business ideas.", keywords: ["startup", "entrepreneurship", "product development", "business validation"] },
  { id: "business-models", subject: "Business and income", situation: "You want to map how an organisation creates value, reaches customers and earns revenue.", materialType: "Book", title: "Business Model Generation", creator: "Alexander Osterwalder and Yves Pigneur", why: "Provides a visual framework for describing and comparing the main parts of a business model.", keywords: ["business model", "value proposition", "customers", "revenue", "entrepreneurship"] },
  { id: "small-business-systems", subject: "Business and income", situation: "You run or plan a small business and want to build repeatable systems instead of depending on the owner's constant intervention.", materialType: "Book", title: "The E-Myth Revisited", creator: "Michael E. Gerber", why: "Explores the roles, processes and systems needed to make a small business more consistent.", keywords: ["small business", "operations", "entrepreneurship", "business systems"] },
  { id: "financial-literacy-business", subject: "Accounting and finance", situation: "You want to read financial statements and understand what business figures reveal about performance.", materialType: "Book", title: "Financial Intelligence for Entrepreneurs", creator: "Karen Berman, Joe Knight and John Case", why: "Explains income statements, balance sheets, cash flow and the meaning behind common financial measures.", keywords: ["accounting", "bookkeeping", "cash flow", "financial statements", "finance"] },
  { id: "development-economics", subject: "Economics and development", situation: "You want to understand why anti-poverty programmes sometimes succeed and sometimes fail.", materialType: "Book", title: "Poor Economics", creator: "Abhijit V. Banerjee and Esther Duflo", why: "Uses economic research to examine the everyday decisions and constraints shaping poverty and development policy.", keywords: ["poverty", "development economics", "public policy", "inequality"] },
  { id: "development-freedom", subject: "Economics and development", situation: "You want to understand development as an expansion of people's real opportunities and freedoms.", materialType: "Book", title: "Development as Freedom", creator: "Amartya Sen", why: "Connects development with capabilities, health, education, political participation and economic opportunity.", keywords: ["human development", "capabilities", "economics", "freedom", "public policy"] },
  { id: "africa-underdevelopment", subject: "African history and society", situation: "You want to examine the historical forces that shaped Africa's economic relationships with the wider world.", materialType: "Book", title: "How Europe Underdeveloped Africa", creator: "Walter Rodney", why: "A major historical and political-economic argument about colonialism and African underdevelopment; compare its thesis with later scholarship.", keywords: ["African history", "colonialism", "Africa", "political economy", "development"] },
  { id: "decolonising-language", subject: "African history and society", situation: "You want to explore the relationship between language, education, culture and colonial power in African societies.", materialType: "Book", title: "Decolonising the Mind", creator: "Ngugi wa Thiong'o", why: "Examines language and literature as forces shaping cultural identity, education and decolonisation.", keywords: ["African literature", "language", "culture", "colonialism", "education"] },
  { id: "african-fiction", subject: "African literature", situation: "You want to explore an influential African novel about social change, community and the effects of colonial encounter.", materialType: "Book", title: "Things Fall Apart", creator: "Chinua Achebe", why: "A landmark novel portraying Igbo society and the disruptions brought by colonial rule and missionary influence.", keywords: ["African fiction", "Nigeria", "Igbo", "colonial history", "literature"] },
  { id: "colonial-psychology", subject: "African history and society", situation: "You want to examine the psychological, cultural and political effects of colonial rule and struggles for liberation.", materialType: "Book", title: "The Wretched of the Earth", creator: "Frantz Fanon", why: "A major work on colonialism, violence, identity and decolonisation; read with attention to its historical context and debated arguments.", keywords: ["colonialism", "decolonisation", "politics", "African studies", "identity"] },
  { id: "rule-of-law", subject: "Politics and governance", situation: "You want to understand what the rule of law requires of governments, courts and public institutions.", materialType: "Book", title: "The Rule of Law", creator: "Tom Bingham", why: "Explains core principles of legality, fairness, access to justice and limits on arbitrary power.", keywords: ["law", "governance", "justice", "constitution", "public institutions"] },
  { id: "political-incentives", subject: "Politics and governance", situation: "You want to understand how political incentives influence leaders, institutions and public decisions.", materialType: "Book", title: "The Dictator's Handbook", creator: "Bruce Bueno de Mesquita and Alastair Smith", why: "Uses selectorate theory to analyse political survival and incentives; treat it as one analytical model rather than a complete account of politics.", keywords: ["political science", "leadership", "governance", "institutions", "power"] },
  { id: "persuasion", subject: "People and influence", situation: "You want to recognise common persuasion techniques and make more deliberate decisions when people try to influence you.", materialType: "Book", title: "Influence: The Psychology of Persuasion", creator: "Robert B. Cialdini", why: "Introduces well-known principles of persuasion and explains how they appear in everyday decisions and marketing.", keywords: ["persuasion", "psychology", "marketing", "decision making", "influence"] },
  { id: "moral-psychology", subject: "People and influence", situation: "You want to understand why people with different values can reach very different moral and political conclusions.", materialType: "Book", title: "The Righteous Mind", creator: "Jonathan Haidt", why: "Explores moral psychology and group identity; its interpretations should be compared with wider research and criticism.", keywords: ["moral psychology", "society", "politics", "culture", "human behaviour"] },
  { id: "meaning-resilience", subject: "Personal development", situation: "You want to reflect on meaning, responsibility and how people respond to difficult circumstances.", materialType: "Book", title: "Man's Search for Meaning", creator: "Viktor E. Frankl", why: "Combines an account of survival in Nazi concentration camps with reflections on meaning and responsibility.", keywords: ["meaning", "resilience", "psychology", "purpose", "personal growth"] },
  { id: "cosmos", subject: "Science and discovery", situation: "You want a broad introduction to astronomy, scientific thinking and humanity's place in the universe.", materialType: "Book", title: "Cosmos", creator: "Carl Sagan", why: "Connects astronomy, the history of science and scientific curiosity through accessible explanations.", keywords: ["astronomy", "space", "physics", "science", "universe"] },
  { id: "time-physics", subject: "Physics and astronomy", situation: "You want an accessible introduction to major questions about space, time, black holes and the universe.", materialType: "Book", title: "A Brief History of Time", creator: "Stephen Hawking", why: "Introduces ideas in cosmology and theoretical physics; some scientific developments have advanced since publication.", keywords: ["physics", "cosmology", "space", "time", "black holes"] },
  { id: "mathematical-thinking", subject: "Mathematics and statistics", situation: "You want to use mathematical reasoning to question claims, interpret data and make better everyday decisions.", materialType: "Book", title: "How Not to Be Wrong", creator: "Jordan Ellenberg", why: "Shows how mathematical ideas help reveal patterns, uncertainty and misleading interpretations in daily life.", keywords: ["mathematics", "statistics", "data literacy", "probability", "critical thinking"] },
  { id: "genetics", subject: "Biology and genetics", situation: "You want to understand how genes influence living organisms, inheritance, disease and human identity.", materialType: "Book", title: "The Gene: An Intimate History", creator: "Siddhartha Mukherjee", why: "Traces the history of genetics and explains major discoveries, debates and ethical questions.", keywords: ["biology", "genetics", "DNA", "medicine", "evolution"] },
  { id: "software-craft", subject: "Computer science and software", situation: "You want to improve how you plan, write, test and maintain software in professional projects.", materialType: "Book", title: "The Pragmatic Programmer", creator: "David Thomas and Andrew Hunt", why: "Offers practical guidance on software craftsmanship, debugging, automation, design and professional habits.", keywords: ["programming", "software engineering", "coding", "developer", "testing"] },
  { id: "clean-code", subject: "Computer science and software", situation: "You want to make software easier to read, maintain and improve as projects grow.", materialType: "Book", title: "Clean Code", creator: "Robert C. Martin", why: "Presents practices for naming, functions, structure and maintainability; examples reflect the book's original language and era.", keywords: ["programming", "software quality", "code review", "software design"] },
  { id: "networking", subject: "Networking and infrastructure", situation: "You want to understand how computers communicate across networks and how internet protocols work.", materialType: "Textbook", title: "Computer Networking: A Top-Down Approach", creator: "James F. Kurose and Keith W. Ross", why: "Explains networking concepts from applications down through transport, network and link layers.", keywords: ["computer networks", "internet", "TCP IP", "network engineering", "protocols"] },
  { id: "cryptography", subject: "Cybersecurity and cryptography", situation: "You want to understand the history and basic principles of codes, encryption and digital security.", materialType: "Book", title: "The Code Book", creator: "Simon Singh", why: "Introduces code-making and code-breaking, from historical ciphers to modern cryptographic ideas.", keywords: ["cybersecurity", "cryptography", "encryption", "privacy", "computer security"] },
  { id: "structures-engineering", subject: "Engineering and invention", situation: "You want to understand why bridges, buildings and machines stand, bend or fail under physical forces.", materialType: "Book", title: "Structures: Or Why Things Don't Fall Down", creator: "J. E. Gordon", why: "Explains structural engineering through accessible examples of forces, materials, stability and failure.", keywords: ["engineering", "civil engineering", "structures", "mechanics", "materials"] },
  { id: "biodiversity", subject: "Agriculture and environment", situation: "You want to understand biodiversity loss and how human activity changes ecosystems.", materialType: "Book", title: "The Sixth Extinction", creator: "Elizabeth Kolbert", why: "Reports on biodiversity loss and the evidence for a human-driven extinction crisis.", keywords: ["biodiversity", "ecology", "environment", "conservation", "climate"] },
  { id: "african-agriculture", subject: "Agriculture and environment", situation: "You want to explore how research, technology and policy can support agricultural innovation in African countries.", materialType: "Book", title: "The New Harvest: Agricultural Innovation in Africa", creator: "Calestous Juma", why: "Examines science, technology and institutional change in efforts to strengthen African agriculture.", keywords: ["African agriculture", "agricultural technology", "food security", "innovation", "development"] },
  { id: "agroecology", subject: "Agriculture and environment", situation: "You want to understand farming approaches that connect soil, biodiversity, ecology and sustainable production.", materialType: "Textbook", title: "Agroecology: The Science of Sustainable Agriculture", creator: "Miguel A. Altieri", why: "Introduces ecological principles and their application to agricultural systems and sustainable farming.", keywords: ["agriculture", "agroecology", "soil", "sustainable farming", "biodiversity"] },
  { id: "food-systems", subject: "Food systems and nutrition", situation: "You want to understand where food comes from and how farming, processing, trade and consumption shape food systems.", materialType: "Book", title: "The Omnivore's Dilemma", creator: "Michael Pollan", why: "Investigates industrial, organic and alternative food chains, mainly through the United States food system.", keywords: ["food systems", "agriculture", "nutrition", "food production", "sustainability"] },
  { id: "end-of-life-care", subject: "Medicine and health", situation: "You want to understand how healthcare decisions can protect dignity and quality of life during serious illness and ageing.", materialType: "Book", title: "Being Mortal", creator: "Atul Gawande", why: "Examines ageing, serious illness, end-of-life care and the importance of aligning treatment with people's priorities.", keywords: ["healthcare", "medicine", "ageing", "public health", "patient care"] },
  { id: "medical-history", subject: "Medicine and health", situation: "You want to learn how cancer research and treatment have developed and why medical progress is complex.", materialType: "Book", title: "The Emperor of All Maladies", creator: "Siddhartha Mukherjee", why: "A history of cancer research, treatment and the people behind major medical developments.", keywords: ["cancer", "medicine", "medical research", "biology", "health"] },
  { id: "learning-science", subject: "Learning and human development", situation: "You want to understand how practice, retrieval and feedback can make learning more durable.", materialType: "Book", title: "Make It Stick", creator: "Peter C. Brown, Henry L. Roediger III and Mark A. McDaniel", why: "Summarises research-based learning strategies such as retrieval practice, spacing and varied practice.", keywords: ["learning science", "study skills", "education", "memory", "teaching"] },
  { id: "critical-pedagogy", subject: "Learning and human development", situation: "You want to examine how education, dialogue and power shape people's ability to understand and change their world.", materialType: "Book", title: "Pedagogy of the Oppressed", creator: "Paulo Freire", why: "A major work on critical pedagogy, dialogue and education as a practice of freedom.", keywords: ["education", "teaching", "critical pedagogy", "literacy", "social change"] },
  { id: "growth-mindset", subject: "Learning and human development", situation: "You want to explore how beliefs about ability can influence learning, effort and responses to difficulty.", materialType: "Book", title: "Mindset", creator: "Carol S. Dweck", why: "Introduces fixed and growth mindset ideas; apply them thoughtfully and alongside broader evidence about learning.", keywords: ["learning", "motivation", "education", "psychology", "personal development"] },
  { id: "urban-poverty", subject: "Society and public life", situation: "You want to understand how housing markets, poverty and public policy affect people living with insecure housing.", materialType: "Book", title: "Evicted", creator: "Matthew Desmond", why: "A reported study of eviction and housing insecurity in the United States, showing how housing instability reinforces poverty.", keywords: ["poverty", "housing", "inequality", "urban studies", "public policy"] },
  { id: "lean-operations", subject: "Leadership and organisations", situation: "You want to understand how organisations can improve quality, reduce waste and make work more reliable.", materialType: "Book", title: "The Toyota Way", creator: "Jeffrey K. Liker", why: "Explains management principles associated with the Toyota Production System and continuous improvement.", keywords: ["operations", "manufacturing", "quality", "lean management", "process improvement"] },
  { id: "supply-chain", subject: "Business operations and logistics", situation: "You want to understand how purchasing, inventory, transport and demand planning fit into a supply chain.", materialType: "Textbook", title: "Supply Chain Management: Strategy, Planning, and Operation", creator: "Sunil Chopra", why: "Provides a structured introduction to supply chain design, inventory, sourcing, logistics and coordination.", keywords: ["logistics", "inventory", "procurement", "distribution", "operations management"] },
  { id: "web-usability", subject: "Technology and design", situation: "You want to make websites and digital products easier for people to understand and use.", materialType: "Book", title: "Don't Make Me Think, Revisited", creator: "Steve Krug", why: "Introduces practical principles of web usability, navigation and lightweight user testing.", keywords: ["UX", "user experience", "web design", "usability", "product design"] },
  { id: "design-principles", subject: "Creativity and the built world", situation: "You want a reference for applying established design principles to products, communication and everyday experiences.", materialType: "Reference book", title: "Universal Principles of Design", creator: "William Lidwell, Kritina Holden and Jill Butler", why: "A visual reference to widely used principles from design, psychology, usability and human behaviour.", keywords: ["graphic design", "product design", "visual communication", "UX", "creativity"] },
  { id: "writing-process", subject: "Writing and communication", situation: "You want to develop a sustainable writing habit and work through the practical difficulties of drafting and revision.", materialType: "Book", title: "Bird by Bird", creator: "Anne Lamott", why: "Offers practical and reflective advice on writing, creative work, revision and managing a large project one step at a time.", keywords: ["writing", "creative writing", "editing", "storytelling", "communication"] },
  { id: "business-writing", subject: "Writing and communication", situation: "You want to write clearer content for customers, colleagues and online audiences.", materialType: "Book", title: "Everybody Writes", creator: "Ann Handley", why: "Provides practical guidance on writing useful, readable content for digital and business communication.", keywords: ["business writing", "content writing", "marketing", "communication", "copywriting"] },
  { id: "clear-writing", subject: "Writing and communication", situation: "You want to improve sentence clarity, grammar and concise written expression.", materialType: "Reference book", title: "The Elements of Style", creator: "William Strunk Jr. and E. B. White", why: "A concise guide to English usage and style; some advice reflects its period and should be adapted to modern contexts.", keywords: ["grammar", "writing", "editing", "English", "style"] },
  { id: "geopolitics", subject: "Geography and global affairs", situation: "You want to explore how geography influences international relations, security and economic choices.", materialType: "Book", title: "Prisoners of Geography", creator: "Tim Marshall", why: "Uses maps and geographic constraints to introduce geopolitical issues; its interpretations are simplified and debated.", keywords: ["geography", "geopolitics", "international relations", "global affairs", "politics"] },
  { id: "creative-confidence", subject: "Creativity and the built world", situation: "You want to understand the uncertainty, fear and practical decisions involved in making creative work.", materialType: "Book", title: "Art and Fear", creator: "David Bayles and Ted Orland", why: "Reflects on the habits and obstacles involved in sustaining a creative practice.", keywords: ["art", "creativity", "design", "creative practice", "artists"] },
  { id: "music-brain", subject: "Music and the arts", situation: "You want to understand how music interacts with memory, perception, emotion and the brain.", materialType: "Book", title: "Musicophilia", creator: "Oliver Sacks", why: "Explores neurological case studies and the many ways music shapes human experience.", keywords: ["music", "neuroscience", "brain", "psychology", "arts"] },
];

const COMPASS_INTENT_GROUPS: Record<string, string[]> = {
  "earn money online": ["online income", "digital business", "ecommerce", "freelancing", "internet business", "make money online"],
  "start a business": ["entrepreneurship", "business idea", "startup", "customers", "market validation", "small business"],
  "poverty and inequality": ["poverty", "inequality", "development", "economic hardship", "low income", "underdevelopment"],
  "culture and identity": ["culture", "traditions", "customs", "anthropology", "identity", "society"],
  "become a lawyer": ["law", "legal reasoning", "advocacy", "court", "lawyer", "legal practice"],
  "become a scientist": ["science", "scientific method", "research", "evidence", "experiments", "discovery"],
  "become a writer": ["writing", "writer", "storytelling", "communication", "craft", "research"],
  "understand people": ["psychology", "human behaviour", "decision making", "influence", "relationships", "judgement"],
  "become a doctor": ["medicine", "medical", "clinical", "health", "diagnosis", "public health"],
  "build technology": ["technology", "computer", "software", "engineering", "coding", "invention"],
  "lead a team": ["leadership", "management", "organisation", "team", "negotiation", "systems"],
  "teach better": ["teaching", "education", "learning", "classroom", "instruction"],
  "understand africa": ["africa", "african history", "colonialism", "culture", "development"],
  "african history": ["african history", "ghana", "west africa", "colonialism", "independence", "asante", "history"],
  "african literature": ["african literature", "nigerian literature", "ghanaian literature", "novel", "poetry", "theatre", "writers"],
  "african philosophy": ["african philosophy", "akan philosophy", "ethics", "decolonisation", "knowledge", "worldviews"],
  "african science": ["african science", "indigenous knowledge", "astronomy", "mathematics", "technology", "medicinal plants"],
  "african governance": ["african governance", "democracy", "political reform", "institutions", "leadership", "citizenship"],
  "african society": ["african society", "contemporary africa", "african cities", "urbanisation", "identity", "development"],
  "protect the environment": ["environment", "climate", "ecology", "agriculture", "conservation"],
};

const COMPASS_STARTERS = [
  "I want to earn money online",
  "I want to understand people and influence",
  "I want to become a better lawyer",
  "I want to learn about African culture",
  "I want to become a scientist",
  "I want to improve my writing",
];

function compassTokens(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\\s]/g, " ").split(/\\s+/).filter(token => token.length > 2);
}

function scoreCompassPathway(item: KnowledgePathway, query: string) {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return 0;
  const tokens = compassTokens(cleanQuery);
  const itemText = [item.situation, item.subject, item.materialType, item.title, item.creator, item.why, ...(item.keywords || [])].join(" ").toLowerCase();
  const itemTokens = new Set(compassTokens(itemText));
  let score = 0;
  for (const token of tokens) if (itemTokens.has(token)) score += 2;
  if (item.situation.toLowerCase().includes(cleanQuery)) score += 8;
  if (item.title.toLowerCase().includes(cleanQuery)) score += 5;
  for (const [phrase, expansions] of Object.entries(COMPASS_INTENT_GROUPS)) {
    if (cleanQuery.includes(phrase) || expansions.some(term => cleanQuery.includes(term))) {
      const related = [phrase, ...expansions].flatMap(compassTokens);
      for (const term of related) if (itemTokens.has(term)) score += 2;
    }
  }
  return score;
}

function KnowledgeCompassPage({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All subjects");
  const subjects = ["All subjects", ...Array.from(new Set(KNOWLEDGE_PATHWAYS.map(item => item.subject)))];
  const ranked = KNOWLEDGE_PATHWAYS
    .filter(item => subject === "All subjects" || item.subject === subject)
    .map(item => ({ item, score: scoreCompassPathway(item, query) }))
    .filter(entry => !query.trim() || entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  const visible = query.trim() ? ranked.slice(0, 12) : ranked.slice(0, 8);
  const [liveRecords, setLiveRecords] = useState<ResearchRecord[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 3) {
      setLiveRecords([]);
      setLiveError("");
      setLiveLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLiveLoading(true);
      setLiveError("");
      try {
        const result = await searchResearchRepositories(clean, controller.signal);
        if (!controller.signal.aborted) {
          setLiveRecords(result.records);
          if (result.sourceErrors.length) {
            setLiveError("Some repositories could not be reached: " + result.sourceErrors.map(item => item.source).join(", "));
          }
        }
      } catch (error) {
        if (!controller.signal.aborted && (error as Error)?.name !== "AbortError") {
          setLiveError("Live repository discovery is temporarily unavailable. Your curated pathways remain available.");
        }
      } finally {
        if (!controller.signal.aborted) setLiveLoading(false);
      }
    }, 650);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-primary px-5 pb-12 pt-8 text-primary-foreground md:px-8 md:pb-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-primary-foreground/5" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-7 flex items-center gap-2 text-xs text-primary-foreground/70">
            <button onClick={onBack} className="hover:text-primary-foreground">Info Discovery</button><ChevronRight className="h-3.5 w-3.5" /><span className="text-primary-foreground">Knowledge Compass</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Knowledge Compass</h1>
          </div>
          <div className="mt-7 rounded-2xl border border-border/20 bg-card p-4 text-foreground shadow-xl">
            <label htmlFor="compass-situation" className="mb-2 block text-sm font-semibold">What would you like to explore?</label>
            <textarea id="compass-situation" value={query} onChange={event => setQuery(event.target.value)} placeholder="Enter a topic, interest or question..." rows={2} className="w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm leading-6 outline-none transition focus-visible:ring-2 focus-visible:ring-ring" />
            <div className="mt-3 flex justify-end">
              <select value={subject} onChange={event => setSubject(event.target.value)} aria-label="Narrow by subject" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>All subjects</option>{subjects.filter(item => item !== "All subjects").map(item => <option key={item}>{item}</option>)}</select>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/65">Try a search</p>
            <div className="mt-2 flex flex-wrap gap-2">{COMPASS_STARTERS.map(starter => <button key={starter} type="button" onClick={() => setQuery(starter)} className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-left text-xs text-primary-foreground transition hover:bg-primary-foreground/20">{starter}</button>)}</div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-9 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{query.trim() ? "Search matches" : "Suggested resources"}</h2>
          <span className="text-xs text-muted-foreground">{visible.length} of {ranked.length}</span>
        </div>
        {visible.length > 0 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map(({ item }) => <article key={item.id} className="min-w-0 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-accent/40 hover:shadow-md">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="max-w-full truncate text-[10px]">{item.subject}</Badge>
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{item.materialType}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold leading-5">{item.title}</h3>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground line-clamp-1">{item.creator}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-3">{item.why}</p>
          </article>)}
        </div>}
        {query.trim().length >= 3 && <section className="mt-5">
          <h3 className="mb-3 text-base font-semibold">Related research</h3>
          {liveLoading && <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</p>}
          {liveError && <p role="status" className="mb-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{liveError}</p>}
          {!liveLoading && liveRecords.length === 0 && !liveError && <p className="text-xs text-muted-foreground">No research results found.</p>}
          {liveRecords.length > 0 && <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {liveRecords.map(record => <article key={record.id} className="min-w-0 rounded-lg border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                <Badge variant="secondary" className="text-[9px]">{record.year || "Year not supplied"}</Badge>
                <span>{record.type}</span>
              </div>
              <h4 className="mt-2 text-sm font-semibold leading-5 line-clamp-2">{record.title}</h4>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground line-clamp-1">{[record.authors, record.journal, record.publisher].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Source: {record.sources.join(", ")}</p>
              {record.abstract && <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-3">{record.abstract}</p>}
            </article>)}
          </div>}
        </section>}
        {!visible.length && !liveLoading && !liveRecords.length && query.trim().length >= 3 && <div className="mt-5 rounded-xl border border-dashed border-border bg-card p-5 text-center">
          <p className="text-sm font-medium">No matching resources found.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setQuery(""); setSubject("All subjects"); }}>Clear search</Button>
        </div>}
      </section>
    </main>
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

  const filteredSections = useMemo(() => selected?.sections.map(section => ({ ...section, items: section.items.filter(item => (sectionFilter === "all" || section.title === sectionFilter) && normalise([item.title, item.description, ...item.questions, item.culture?.community || "", item.culture?.history || "", item.culture?.wayOfLife || "", item.culture?.traditions || "", item.culture?.music || "", item.festival?.origin || "", item.festival?.meaning || "", item.festival?.celebration || "", item.festival?.location || "", item.kingdom?.country || "", item.kingdom?.period || "", item.kingdom?.overview || "", item.kingdom?.legacy || "", item.kingdom?.context || "", item.touristSite?.country || "", item.touristSite?.location || "", item.touristSite?.siteType || "", item.touristSite?.overview || "", item.touristSite?.history || "", item.touristSite?.significance || "", item.touristSite?.locationDetail || "", item.touristSite?.visitorExperience || ""].join(" ")).includes(normalise(topicFilter.trim()))) })).filter(section => section.items.length > 0) || [], [selected, sectionFilter, topicFilter]);
  const searchIndex = useMemo(() => categories.flatMap(category => [
    { kind: "area" as const, label: category.title, detail: category.summary, category, slug: category.slug },
    ...allTopics(category).map(item => ({
      kind: "topic" as const,
      label: item.title,
      detail: [item.section, item.description, item.questions.join(" "), item.culture?.community || "", item.culture?.history || "", item.culture?.wayOfLife || "", item.culture?.traditions || "", item.culture?.music || "", item.festival?.origin || "", item.festival?.meaning || "", item.festival?.celebration || "", item.festival?.location || "", item.kingdom?.country || "", item.kingdom?.period || "", item.kingdom?.overview || "", item.kingdom?.legacy || "", item.kingdom?.context || "", item.touristSite?.country || "", item.touristSite?.location || "", item.touristSite?.siteType || "", item.touristSite?.overview || "", item.touristSite?.history || "", item.touristSite?.significance || "", item.touristSite?.locationDetail || "", item.touristSite?.visitorExperience || "", category.slug === "business-management" ? BUSINESS_SEARCH_TERMS[item.slug] || "" : "", category.slug === "agriculture-climate-intelligence" ? AGRICULTURE_SEARCH_TERMS[item.slug] || "" : "", category.slug === "travel-destination" ? TRAVEL_SEARCH_TERMS[item.slug] || "" : "", category.slug === "operational-intelligence" ? OPERATIONAL_SEARCH_TERMS[item.slug] || "" : "", category.slug === "financial-operations" ? FINANCIAL_SEARCH_TERMS[item.slug] || "" : ""].join(" · "),
      category,
      slug: item.slug,
    })),
  ]), []);
  const searchResults = useMemo(() => {
    const clean = normalise(query.trim());
    if (!clean) return [];
    const terms = clean.split(/\s+/).filter(term => term.length > 1 && !SEARCH_STOP_WORDS.has(term));
    const lookupTerms = terms.length ? terms : [clean];
    const minimumMatches = lookupTerms.length <= 2 ? 1 : Math.max(1, Math.ceil(lookupTerms.length * 0.5));
    return searchIndex
      .map(item => {
        const title = normalise(item.label);
        const searchable = normalise([item.label, item.detail, item.category.title].join(" "));
        const matchedTerms = lookupTerms.filter(term => searchable.includes(term)).length;
        const titleScore = title === clean ? 100 : title.startsWith(clean) ? 60 : title.includes(clean) ? 40 : 0;
        const coverageScore = matchedTerms / lookupTerms.length;
        return { item, score: titleScore + matchedTerms * 12 + coverageScore * 8, matchedTerms };
      })
      .filter(result => result.matchedTerms >= minimumMatches)
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

  if (categorySlug === "knowledge-compass" && !topicSlug) {
    return <KnowledgeCompassPage onBack={() => navigate("/info-discovery")} />;
  }

  if (selected?.slug === "it-innovation") {
    return <InfoServicesLanding href={selected.product?.href || "https://info.amineva.com/"} />;
  }

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
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3"><Search className="h-5 w-5 shrink-0 text-muted-foreground" /><Input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => window.setTimeout(() => setShowSuggestions(false), 160)} placeholder="What are you trying to understand?" className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" aria-label="Search Info Discovery" /></div>
              <Button type="submit" className="h-11 bg-accent px-6 text-accent-foreground hover:bg-accent/90" disabled={!query.trim()}>Explore <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
            
            {showSuggestions && query.trim() && <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-card p-2 text-left text-foreground shadow-2xl">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Suggested investigation paths</p>
              {searchResults.length > 0 ? searchResults.map((result, index) => <button key={result.category.slug + result.slug + index} type="button" onMouseDown={e => e.preventDefault()} onClick={() => result.kind === "area" ? goToCategory(result.category.slug) : goToTopic(result.category.slug, result.slug)} className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-accent/5">
                <span className="mt-0.5 rounded-xl border border-accent/20 bg-accent/10 p-2 text-accent">{result.kind === "area" ? <result.category.icon className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold group-hover:text-primary">{result.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{result.category.title}{result.kind === "topic" ? " · " + result.detail.split(" · ")[0] : ""}</span></span><ChevronRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </button>) : <div className="px-3 py-5"><p className="text-sm font-semibold text-foreground">No guide matches that wording.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Try another phrase or browse the closest area. Each guide provides a structured way to investigate the subject and follow original sources.</p></div>}
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
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Career Development Platform</span>
                <span className="block text-xl font-bold tracking-tight text-foreground">Adesua</span>
                <span className="mt-1.5 block max-w-xl text-sm leading-6 text-muted-foreground">Explore career awareness, development and practical pathways through Adesua.</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">Continue to Adesua <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
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

      {!selectedTopic && selected?.slug === "business-management" && selected.product && <InventraSpotlight product={selected.product} />}
      {!selectedTopic && selected?.slug === "agriculture-climate-intelligence" && selected.product && <AgroClimateSpotlight product={selected.product} />}
      {!selectedTopic && selected?.slug === "financial-operations" && selected.product && <SikasɛmSpotlight product={selected.product} />}

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
              <button onClick={() => navigate("/info-discovery/knowledge-compass")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Compass className="h-4 w-4 shrink-0 text-accent" /><span>Knowledge Compass</span><span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-semibold text-accent">NEW</span></button>
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
            <p className="text-xs leading-5 text-muted-foreground">Start with an area, narrow to an investigation topic, then follow the questions and source routes. Amineva organises the subject and helps you identify what must be checked; it does not claim that a generated answer is the evidence. Confirm current rules and decisions with the responsible authority.</p>
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
                  <Lightbulb className="h-4 w-4" /> {selectedTopic.kingdom ? "African Kingdoms" : selectedTopic.touristSite ? "African Tourist Sites" : selectedTopic.culture || selectedTopic.festival ? "Culture and Tradition" : "What this topic helps you investigate"}
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {selectedTopic.touristSite ? "African tourist site" : selectedTopic.kingdom ? "African kingdom" : selectedTopic.festival ? "African festival" : selectedTopic.culture ? "African cultural profile" : "Amineva Global Research Topic"}
                </Badge>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                {selectedTopic.title}
              </h2>
              <p className="mt-1 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">
                {selectedTopic.description}
              </p>
              {(selectedTopic.kingdom || selectedTopic.touristSite) && (
                <WikimediaProfileImage
                  title={selectedTopic.title}
                  country={selectedTopic.kingdom?.country || selectedTopic.touristSite?.country || ""}
                  kind={selectedTopic.kingdom ? "kingdom" : "tourist site"}
                />
              )}
              {selectedTopic.kingdom && (
                <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="African kingdom profile">
                  {[
                    { title: "Country or region", text: selectedTopic.kingdom.country },
                    { title: "Historical period", text: selectedTopic.kingdom.period },
                    { title: "Kingdom and its history", text: selectedTopic.kingdom.overview },
                    { title: "Historical legacy", text: selectedTopic.kingdom.legacy },
                    { title: "Historical context", text: selectedTopic.kingdom.context || "" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-border bg-background/70 p-4">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground whitespace-pre-line">{item.text}</p>
                    </div>
                  ))}
                </section>
              )}
              {selectedTopic.touristSite && (
                <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="African tourist site profile">
                  {[
                    { title: "Country", text: selectedTopic.touristSite.country },
                    { title: "Location", text: selectedTopic.touristSite.location + ". " + selectedTopic.touristSite.locationDetail },
                    { title: "Site type", text: selectedTopic.touristSite.siteType },
                    { title: "About the site", text: selectedTopic.touristSite.overview },
                    { title: "History", text: selectedTopic.touristSite.history },
                    { title: "Significance", text: selectedTopic.touristSite.significance },
                    { title: "Visitor experience", text: selectedTopic.touristSite.visitorExperience },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-border bg-background/70 p-4">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground whitespace-pre-line">{item.text}</p>
                    </div>
                  ))}
                </section>
              )}
              {selectedTopic.festival && (
                <section className="mt-6 space-y-3" aria-label="Festival profile">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { title: "Origins", text: selectedTopic.festival.origin },
                      { title: "Cultural meaning", text: selectedTopic.festival.meaning },
                      { title: "How it is celebrated", text: selectedTopic.festival.celebration },
                      { title: "Where it takes place", text: selectedTopic.festival.location },
                    ].map((item) => (
                      <div key={item.title} className="rounded-xl border border-border bg-background/70 p-4">
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground whitespace-pre-line">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {selectedTopic.culture && (
                <section className="mt-6 space-y-3" aria-label="Cultural profile">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Community profile</Badge>
                    <span className="text-xs text-muted-foreground">{selectedTopic.culture.community}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { title: "History", text: selectedTopic.culture.history },
                      { title: "Way of life", text: selectedTopic.culture.wayOfLife },
                      { title: "Traditions", text: selectedTopic.culture.traditions },
                      { title: "Music", text: selectedTopic.culture.music },
                    ].map((item) => (
                      <div key={item.title} className="rounded-xl border border-border bg-background/70 p-4">
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!selectedTopic.culture && !selectedTopic.festival && !selectedTopic.kingdom && !selectedTopic.touristSite && <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground">Questions to answer</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {selectedTopic.questions.map(q => (
                    <div key={q} className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm leading-6">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      {q}
                    </div>
                  ))}
                </div>
              </div>}

              {/* Ask about this topic alongside evidence checklist */}
              {!selectedTopic.culture && !selectedTopic.festival && !selectedTopic.kingdom && !selectedTopic.touristSite && <div className="mt-6 grid gap-4 md:grid-cols-2">
                <AskTopicPanel
                  topicTitle={selectedTopic.title}
                  categoryTitle={selected.title}
                  description={selectedTopic.description}
                  questions={selectedTopic.questions}
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
              </div>}

              {/* Project main goal & number to track for schools & organisations */}
              {!selectedTopic.culture && !selectedTopic.festival && !selectedTopic.kingdom && !selectedTopic.touristSite && <ProjectGoalTracker
                mainGoal={mainGoal}
                onChangeMainGoal={setMainGoal}
                numberToTrack={numberToTrack}
                onChangeNumberToTrack={setNumberToTrack}
              />}
            </article>

            {!selectedTopic.culture && !selectedTopic.festival && !selectedTopic.kingdom && !selectedTopic.touristSite && <ResearchPanel initialQuery={selectedTopic.title} />}
            <CategoryProductPanel product={selected.product} />
            {selected.slug === "travel-destination" && (
              <>
                <CountryExplorer onCountriesLoaded={setCountryList} />
                <VisaChecker countries={countryList} />
              </>
            )}
            {selected.slug === "agriculture-climate-intelligence" && <ClimateExplorer />}

            {!selectedTopic.culture && !selectedTopic.festival && !selectedTopic.kingdom && !selectedTopic.touristSite && <p className="text-[11px] text-muted-foreground">
              This topic guide is an investigation structure. It does not itself certify a current visa rule, price, job vacancy, crop condition or organisational finding.
            </p>}
          </section>}

          {selected && !selectedTopic && <section className="space-y-6">
            <div className={"rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8 " + (selected.slug === "business-management" ? "border-t-4 border-t-accent" : selected.slug === "agriculture-climate-intelligence" ? "border-r-4 border-r-success" : selected.slug === "operational-intelligence" ? "border-b-4 border-b-primary" : "border-l-4 border-l-accent")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary"><span className="rounded-xl border border-accent/25 bg-accent/10 p-2 text-accent"><selected.icon className="h-4 w-4" /></span>Area overview</div>
                <div className="flex flex-wrap gap-2"><Badge variant="outline">{allTopics(selected).length} topics</Badge><Badge variant="outline">{selected.sections.length} subject groups</Badge></div>
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">{selected.purpose}</p>
            </div>
            {selected.slug === "investigations-archive" && <InvestigationsArchive />}
            {selected.slug === "commercial-law" && <BusinessCaseReference />}
            {selected.slug === "date-and-incidents" ? <DateAndIncidents /> : <>
            <div><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Subject menu</h2><p className="mt-1 text-sm text-muted-foreground">Search within this area or filter by subject group.</p></div><Badge variant="outline">{filteredSections.reduce((count, section) => count + section.items.length, 0)} matching topics</Badge></div>
              <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,240px)]"><Input value={topicFilter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopicFilter(e.target.value)} placeholder={selected.slug === "culture-and-tradition" ? "Find a country, community or festival" : "Filter topics and questions"} aria-label="Filter topics in this discovery area" /><select value={sectionFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSectionFilter(e.target.value)} aria-label="Filter by subject group" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All subject groups</option>{selected.sections.map(section => <option key={section.title} value={section.title}>{section.title}</option>)}</select></div>
              {filteredSections.length ? <div className="space-y-4">{filteredSections.map((section, sectionIndex) => {
                const edgeClasses = ["border-t-4 border-t-primary", "border-r-4 border-r-accent", "border-b-4 border-b-success/75", "border-l-4 border-l-primary/75"];
                const groupAccent = edgeClasses[sectionIndex % edgeClasses.length];
                return <section key={section.title} className={"rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md " + groupAccent}>
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{section.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{section.description}</p></div><Badge variant="outline">{section.items.length}</Badge></div>
                  <div className={selected.slug === "culture-and-tradition" ? "mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-4" : "mt-4 grid gap-3 md:grid-cols-2"}>{section.items.map((item, itemIndex) => {
                    const cardEdges = ["border-t-[3px] border-t-primary/80", "border-r-[3px] border-r-accent", "border-b-[3px] border-b-success/70", "border-l-[3px] border-l-primary/65"];
                    const cardAccent = cardEdges[(itemIndex + sectionIndex) % cardEdges.length];
                    return <button key={item.title} onClick={() => goToTopic(selected.slug, slugify(item.title))} className={"group relative flex flex-col rounded-xl border border-border bg-background/70 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 " + (selected.slug === "culture-and-tradition" ? "min-h-24 p-3" : "min-h-36 p-4") + " " + cardAccent}>
                      <span className="flex items-center justify-between gap-2"><span className={selected.slug === "culture-and-tradition" ? "text-xs font-semibold leading-5" : "text-sm font-semibold"}>{item.title}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></span>
                      <span className="mt-2 block flex-1 text-xs leading-5 text-muted-foreground">{item.description}</span>
                      <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-primary opacity-80 group-hover:opacity-100">{selected.slug === "culture-and-tradition" ? "Explore profile" : "Explore topic"} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
                    </button>;
                  })}</div>
                </section>;
              })}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No topics match these filters. Clear the search or select all subject groups.</div>}
            </div>
            {selected.slug === "travel-destination" && <CountryExplorer />}
            {selected.slug === "agriculture-climate-intelligence" && <ClimateExplorer />}
            {selected.slug !== "culture-and-tradition" && <ResearchPanel initialQuery={selected.title} />}

            {selected.slug === "operational-intelligence" && <div className="rounded-2xl border border-border bg-muted/40 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-accent" /> Authorised evidence only</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Verification and anomaly detection require approved connections to source systems, documented permissions and review controls. This public information area explains the method; it does not claim access to private organisational records.</p></div>}
            </>}
          </section>}

          {!selected && <section className="space-y-7">
            {/* Popular Topics & Recently Viewed Quick-Start */}
            <PopularAndRecent
              recentTopics={recentTopicsList}
              onSelectTopic={(catSlug: string, topSlug: string) => goToTopic(catSlug, topSlug)}
              onSelectRecent={onSelectRecent}
              onClearRecent={onClearRecent}
            />

            <div><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Explore all discovery areas</h2><p className="mt-1 text-sm text-muted-foreground">Choose an area, work through its subject guides, examine the evidence questions and follow an appropriate next step.</p></div><Badge variant="outline">{categories.length} areas</Badge></div>
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

function CategoryProductPanel({ product }: { product?: ProductLink }) {
  if (!product) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs leading-5 text-muted-foreground">{product.introduction}</p>
        <a href={product.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          {product.label} <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}

function InfoServicesLanding({ href }: { href: string }) {
  const services = [
    { icon: GraduationCap, title: "Career & Education", description: "Explore career opportunities and education pathways with clear information and professional guidance to help you choose your next step." },
    { icon: BriefcaseBusiness, title: "Business Information", description: "Understand business opportunities, market entry, competitors, products and expansion before making important business decisions." },
    { icon: FileText, title: "Contracts & Communication", description: "Get clarity on responsibilities, important terms and practical considerations before entering agreements or transactions." },
    { icon: Plane, title: "Travel & Relocation", description: "Access destination-specific information when planning to travel, study, work or relocate internationally." },
    { icon: ShieldCheck, title: "Info and Reports Verification", description: "Have existing information, documents, reports, claims and business details independently checked against relevant sources and evidence." },
  ];
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-primary px-5 py-20 text-primary-foreground md:px-8 md:py-28">
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 -z-10 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent"><Globe2 className="h-4 w-4" /> Amineva Global</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">Information for <span className="block text-accent">Better Decisions</span></h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-primary-foreground/85 md:text-lg">Important decisions deserve clear, dependable information. Whether you are exploring an opportunity, considering an agreement, planning a move or checking details you have received, Amineva Global Info Services helps you understand what matters before you take the next step.</p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-primary-foreground/70 md:text-base">Receive information and professional advisory support directly, or request a carefully prepared written document or report when that better suits your needs.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">What we can help with</p><h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Our Info Services</h2><p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">Practical information and professional support across five service areas, shaped around the questions and decisions that matter to you.</p></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
          {services.map((service, index) => <article key={service.title} className={`group rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl ${index < 3 ? "xl:col-span-2" : "xl:col-span-3"}`}><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition group-hover:scale-105"><service.icon className="h-6 w-6" /></div><h3 className="mt-5 text-xl font-bold tracking-tight">{service.title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{service.description}</p></article>)}
        </div>
      </section>
      <section className="border-y border-border bg-secondary/40 px-5 py-14 md:px-8"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Globe2 className="h-5 w-5" /></div><h2 className="mt-4 text-xl font-bold">Clear information and professional advice</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Talk through the matter you need to understand and receive clear information, explanations and practical advisory support to help you consider your options.</p></div>
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><FileText className="h-5 w-5" /></div><h2 className="mt-4 text-xl font-bold">Written documents and reports when needed</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">If you prefer a written output, we can prepare a document or report that organises the relevant information around your request. The format depends on what you need.</p></div>
      </div></section>
      <section className="mx-auto max-w-5xl px-5 py-16 text-center md:px-8 lg:py-20"><span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Take the next step</span><h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Get the information you need to move forward.</h2><p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">Tell us what you are trying to understand. We will help you identify the information or support you need and the most suitable way to provide it.</p>
        <a href={href} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-accent-foreground shadow-md transition hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Visit Info Services <ArrowUpRight className="h-4 w-4" /></a>
      </section>
    </main>
  );
}

function SikasɛmSpotlight({ product }: { product: ProductLink }) {
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
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">Know where your organisation’s money goes.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Monitoring income, expenses, payments and outstanding amounts helps an organisation understand its financial position, identify unusual activity, plan cash needs and make decisions based on accurate records. Without clear transaction records and regular checks, small errors can grow into losses and cash-flow problems.</p>
            <a href={product.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Visit Sikasɛm <ArrowUpRight className="h-4 w-4" /></a>
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
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent"><Sprout className="h-3.5 w-3.5" /> Agriculture and climate</span>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">Good agricultural decisions start with understanding conditions.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Weather, soil, water, crop health, seasonal changes and market conditions all influence farming outcomes. Understanding how these factors connect helps farmers plan ahead, manage uncertainty, use resources carefully and make better decisions throughout the production cycle.</p>
            <a href={product.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Visit AgroClimate <ArrowUpRight className="h-4 w-4" /></a>
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
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent"><Package className="h-3.5 w-3.5" /> Business management</span>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">Understand what is happening across your business.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">A business needs to know what it owns, what it sells, what it spends and where resources are going. Reliable records and regular checks help owners reduce avoidable losses, respond to changing demand, serve customers better and make informed decisions as the business grows.</p>
            <a href={product.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Visit Inventra <ArrowUpRight className="h-4 w-4" /></a>
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
