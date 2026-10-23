/* StudyAbroad — ข้อมูลประเทศ (ออสเตรเลีย นิวซีแลนด์ แคนาดา)
   แก้ไฟล์นี้เพื่ออัปเดตกฎ ตัวเลข และลิงก์ โดยไม่ต้องแตะ index.html
   หลังแก้ ให้เปลี่ยนเลขเวอร์ชันใน sw.js (CACHE) ผู้ใช้จะได้ข้อมูลใหม่ตอนเปิดแอปครั้งถัดไป

   DATA_AS_OF = วันที่ค้นข้อมูลล่าสุด ทุกตัวเลขต้องตรวจซ้ำในลิงก์ทางการก่อนยื่นจริง
   รูปแบบ:
   - COUNTRIES[code] = {f ธง, n ชื่อ, c สกุลเงิน, e:[ตำรวจ, รถพยาบาล], cities:{id:{n, rentW ค่าเช่า/สัปดาห์, livM ค่ากินอยู่/เดือน ไม่รวมค่าเช่า}},
       visas:{student|whv:{...}}, links:[[ชื่อ, ลิงก์]], embassy:[...], arrival:[...], rules:[...]}
   - visas[x] = {n ชื่อวีซ่า, ok ใช้ได้กับคนไทยไหม, status ข้อความเตือนสถานะ, tuitionW ค่าเรียน/สัปดาห์, enrol ค่าแรกเข้า, ins ประกัน/ปี,
       fee ค่าวีซ่า, funds เงินที่ต้องแสดง, studyMax เรียนได้สูงสุดกี่สัปดาห์, work ข้อความ, workH ชม./สัปดาห์ (ประมาณ), tasks ไทม์ไลน์เฉพาะ}
   - งานในไทม์ไลน์: {id, d วันก่อนเดินทาง (ติดลบ), t หัวข้อ, x รายละเอียด, u ลิงก์}
*/
'use strict';
const DATA_AS_OF = '2026-10-23';

const CURR = {
  THB:{s:'฿',n:'บาท'}, AUD:{s:'A$',n:'ดอลลาร์ออสเตรเลีย'}, NZD:{s:'NZ$',n:'ดอลลาร์นิวซีแลนด์'},
  CAD:{s:'C$',n:'ดอลลาร์แคนาดา'}, USD:{s:'US$',n:'ดอลลาร์สหรัฐ'}
};
// เรทสำรอง (บาทต่อ 1 หน่วย) ใช้เมื่อดึงเรทสดไม่ได้ — ค่าประมาณช่วง ก.ย.–ต.ค. 2026
const FALLBACK = {AUD:23.7, NZD:19.5, CAD:23.5, USD:33.0};

const THAI_MFA = {n:'Call Center กรมการกงสุล (24 ชม.)', tel:'+6625728442', show:'+66 2 572 8442', u:'https://consular.mfa.go.th'};

const COMMON_TASKS = [
  {id:'c_budget', d:-300, t:'ตั้งงบและเลือกประเทศ/เมือง', x:'ใช้หน้า "เทียบประเทศ" และ "งบ" ในแอปนี้ ดูว่าเงินพอถึงเดือนไหน'},
  {id:'c_pass', d:-240, t:'เช็กอายุพาสปอร์ต', x:'ควรเหลืออายุเกินช่วงที่อยู่ต่างประเทศอย่างน้อย 6 เดือน ถ้าไม่ถึงให้ต่ออายุก่อนยื่นวีซ่า'},
  {id:'c_bank', d:-150, t:'เตรียมหลักฐานการเงิน', x:'Statement ย้อนหลังและหนังสือรับรองยอดเงินภาษาอังกฤษ ถ้าใช้เงินผู้สนับสนุนต้องมีหนังสือรับรองและหลักฐานความสัมพันธ์'},
  {id:'c_trans', d:-140, t:'แปลเอกสารเป็นภาษาอังกฤษ', x:'ทะเบียนบ้าน สูติบัตร ใบเปลี่ยนชื่อ วุฒิการศึกษา Transcript ตามที่วีซ่าขอ'},
  {id:'c_medcert', d:-45, t:'ตรวจสุขภาพฟัน/ร่างกาย และใบรับรองแพทย์ภาษาอังกฤษ', x:'ถ้ามียาประจำตัว ขอใบสั่งยาภาษาอังกฤษ และเช็กว่ายานั้นนำเข้าได้'},
  {id:'c_money', d:-40, t:'เตรียมเงิน/บัตร', x:'บัตร Travel card หรือบัตรเดบิตต่างประเทศ แลกเงินสดไว้ใช้ 1–2 สัปดาห์แรก แจ้งธนาคารไทยว่าจะใช้บัตรต่างประเทศ'},
  {id:'c_flight', d:-60, t:'ซื้อตั๋วเครื่องบิน (หลังได้วีซ่าแล้ว)', x:'อย่าซื้อตั๋วแบบคืนเงินไม่ได้ก่อนวีซ่าออก'},
  {id:'c_stay', d:-50, t:'จองที่พักช่วงแรก', x:'Homestay หรือที่พักชั่วคราว 2–4 สัปดาห์ แล้วค่อยหาห้องระยะยาวตอนไปถึง ระวังมิจฉาชีพให้โอนมัดจำก่อนดูห้อง'},
  {id:'c_scan', d:-30, t:'สแกนเอกสารทั้งหมดเข้าแอป', x:'พาสปอร์ต วีซ่า จดหมายตอบรับ ประกัน วุฒิ เก็บในหน้า "เอกสาร" และตั้งวันหมดอายุ'},
  {id:'c_sim', d:-14, t:'เตรียมโทรศัพท์', x:'เปิดโรมมิ่งหรือซื้อ eSIM ไว้ใช้วันแรก ตั้งค่าแอปธนาคารไทยให้ใช้ได้จากต่างประเทศ (OTP)'},
  {id:'c_pack', d:-10, t:'จัดกระเป๋า', x:'ใช้แอป TripBudget ช่วยเช็กของได้ ระวังของต้องห้ามด้านกักกันโรค (อาหารสด เมล็ดพืช เนื้อสัตว์)'},
  {id:'c_sos', d:-7, t:'กรอกการ์ดฉุกเฉินในแอปนี้', x:'ที่อยู่ที่พัก เบอร์โรงเรียน เลขกรมธรรม์ ผู้ติดต่อฉุกเฉิน'},
  {id:'c_reg', d:-5, t:'ลงทะเบียนคนไทยในต่างประเทศ', x:'แจ้งสถานทูต/สถานกงสุลไทยในประเทศปลายทาง เพื่อให้ติดต่อได้ยามฉุกเฉิน'},
  {id:'c_backup', d:-2, t:'สำรองข้อมูลแอปเก็บไว้ใน Google Drive', x:'เมนู ☰ › สำรองข้อมูล'}
];

const COUNTRIES = {
  AU:{
    f:'🇦🇺', n:'ออสเตรเลีย', c:'AUD', e:['000','000'], tz:'Australia/Sydney',
    cities:{
      syd:{n:'ซิดนีย์', rentW:330, livM:1100}, mel:{n:'เมลเบิร์น', rentW:290, livM:1050},
      bne:{n:'บริสเบน', rentW:270, livM:1000}, per:{n:'เพิร์ท', rentW:260, livM:1000}, adl:{n:'แอดิเลด', rentW:240, livM:950}
    },
    visas:{
      student:{
        n:'Student visa (subclass 500)', ok:true,
        tuitionW:350, enrol:250, ins:650, fee:2050, feeNote:'ค่าวีซ่าสาย ELICOS/non-award ตั้งแต่ 1 ก.ค. 2026 (สายปกติ AUD 2,500)',
        funds:29710, fundsNote:'ค่าครองชีพ 12 เดือนที่ต้องแสดง ไม่รวมค่าเรียนและค่าเดินทาง',
        studyMax:0, workH:24,
        work:'ทำงานได้ 48 ชม. ต่อ 2 สัปดาห์ช่วงเปิดเรียน ช่วงปิดเทอมตามตารางของโรงเรียนไม่จำกัด เริ่มทำงานได้หลังคอร์สเริ่มแล้วเท่านั้น',
        tasks:[
          {id:'au_s_school', d:-210, t:'เลือกโรงเรียนภาษา (ELICOS) ที่มีรหัส CRICOS', x:'ตรวจรหัสโรงเรียนและคอร์สในเว็บ CRICOS ก่อนจ่ายเงิน เทียบค่าเรียนต่อสัปดาห์ และดูว่าโรงเรียนมีปิดเทอมช่วงไหน', u:'https://cricos.education.gov.au'},
          {id:'au_s_coe', d:-150, t:'จ่ายค่าเรียนงวดแรกและรับ CoE', x:'Confirmation of Enrolment ต้องใช้ตอนยื่นวีซ่า'},
          {id:'au_s_oshc', d:-140, t:'ซื้อประกัน OSHC ให้ครอบคลุมตลอดวีซ่า', x:'เป็นเงื่อนไขบังคับของวีซ่า 500 โรงเรียนมักจัดให้ได้', u:'https://www.privatehealth.gov.au/health_insurance/overseas/overseas_student_health_cover.htm'},
          {id:'au_s_gs', d:-130, t:'เขียนคำตอบ Genuine Student (GS)', x:'อธิบายว่าทำไมเลือกคอร์ส/ประเทศนี้ เกี่ยวกับงานหรืออนาคตอย่างไร และจะกลับไทยหลังเรียน'},
          {id:'au_s_apply', d:-120, t:'ยื่นวีซ่า 500 ผ่าน ImmiAccount', x:'อาจต้องสแกนนิ้ว/ตรวจสุขภาพเพิ่มตามที่สถานทูตแจ้ง อย่าซื้อตั๋วจนกว่าวีซ่าจะออก', u:'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500'}
        ]
      },
      whv:{
        n:'Work and Holiday visa (subclass 462)', ok:true,
        status:'⚠️ ช่วง ส.ค.–ก.ย. 2026 การรับสมัครสำหรับคนไทยถูกพักไว้ (โควตา 2,000 คน/ปี) ยังไม่ประกาศวันเปิดใหม่ ตรวจหน้าสถานะโควตาของ Home Affairs ก่อนวางแผน',
        tuitionW:350, enrol:250, ins:700, fee:840, feeNote:'ค่าวีซ่าครั้งแรกตั้งแต่ 1 ก.ค. 2026 (จากบทความนักกฎหมายอพยพ ตรวจในเว็บทางการอีกครั้ง)',
        funds:5000, fundsNote:'เงินสำหรับช่วงแรก ประมาณ AUD 5,000 บวกค่าตั๋วขากลับ',
        studyMax:17, workH:38,
        work:'ทำงานได้เต็มเวลา แต่อยู่กับนายจ้างรายเดียวได้ไม่เกิน 6 เดือน เรียนได้รวมไม่เกิน 4 เดือน (17 สัปดาห์)',
        age:'อายุ 18–30 ปี (ยื่นได้ก่อนอายุครบ 31)',
        tasks:[
          {id:'au_w_ielts', d:-240, t:'สอบ IELTS (หรือเทียบเท่า)', x:'ระดับ Functional English โดยทั่วไป IELTS เฉลี่ย 4.5 ขึ้นไป'},
          {id:'au_w_dcy', d:-200, t:'ขอหนังสือรับรอง (Letter of Support) จากกรมกิจการเด็กและเยาวชน', x:'ต้องมีวุฒิปริญญาหรือเรียนมหาวิทยาลัยแล้วอย่างน้อย 2 ปี ติดตามประกาศรอบรับสมัครของกรม', u:'https://www.dcy.go.th'},
          {id:'au_w_cap', d:-190, t:'เช็กว่าโควตาของไทยเปิดรับอยู่หรือไม่', x:'ถ้าถูกพักไว้ ต้องรอรอบใหม่ (ปีโครงการเริ่ม 1 ก.ค.)', u:'https://immi.homeaffairs.gov.au/what-we-do/whm-program'},
          {id:'au_w_apply', d:-120, t:'ยื่นวีซ่า 462', x:'ต้องยื่นจากนอกออสเตรเลีย และไม่เคยได้วีซ่า 462/417 มาก่อน', u:'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462'},
          {id:'au_w_course', d:-90, t:'เลือกคอร์สภาษาไม่เกิน 17 สัปดาห์ (ถ้าจะเรียน)', x:'วีซ่านี้เรียนได้รวมสูงสุด 4 เดือน'}
        ]
      }
    },
    arrival:[
      {id:'au_a_addr', t:'แจ้งที่อยู่กับโรงเรียนภายใน 7 วันหลังถึง', x:'และแจ้งทุกครั้งที่ย้ายภายใน 7 วัน (เงื่อนไขวีซ่านักเรียน)', who:'student'},
      {id:'au_a_sim', t:'ซื้อซิมโทรศัพท์', x:'ซิมเติมเงินซื้อได้ที่สนามบิน ซูเปอร์มาร์เก็ต ต้องลงทะเบียนด้วยพาสปอร์ต'},
      {id:'au_a_bank', t:'เปิดบัญชีธนาคาร', x:'เปิดออนไลน์ได้ก่อนไป แล้วยืนยันตัวตนที่สาขาด้วยพาสปอร์ต'},
      {id:'au_a_tfn', t:'ขอเลขผู้เสียภาษี (TFN)', x:'จำเป็นก่อนเริ่มทำงาน ถ้าไม่มี นายจ้างจะหักภาษีในอัตราสูงสุด ขอฟรีออนไลน์', u:'https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn'},
      {id:'au_a_oshc', t:'ดาวน์โหลดบัตรประกัน OSHC/ประกันเข้าแอปประกัน', x:'ประกันต้องไม่ขาดตลอดวีซ่า'},
      {id:'au_a_transport', t:'ทำบัตรโดยสารสาธารณะ', x:'เช่น Opal (ซิดนีย์) Myki (เมลเบิร์น) go card (บริสเบน) — หลายเมืองแตะบัตรเครดิตได้'},
      {id:'au_a_house', t:'หาที่พักระยะยาว', x:'ดูห้องจริงก่อนจ่าย ขอสัญญาเป็นลายลักษณ์อักษร มัดจำ (bond) ควรฝากผ่านหน่วยงานรัฐของรัฐนั้น'},
      {id:'au_a_gp', t:'หาคลินิกแพทย์ทั่วไป (GP) ใกล้ที่พัก', x:'เช็กว่าคลินิกรับประกันของเราแบบ direct billing ไหม'},
      {id:'au_a_fairwork', t:'รู้สิทธิ์แรงงานก่อนหางาน', x:'ค่าแรงขั้นต่ำใช้กับนักเรียนต่างชาติด้วย อย่ารับงานจ่ายเงินสดต่ำกว่าขั้นต่ำ', u:'https://www.fairwork.gov.au/find-help-for/visa-holders-and-migrants'}
    ],
    rules:[
      {h:'⏱ ทำงานพิเศษ', p:{student:'สูงสุด 48 ชม. ต่อ 2 สัปดาห์ (fortnight) ช่วงเปิดเรียน นับรวมทุกงานและงานไม่รับค่าจ้าง ช่วงปิดเทอมตามตารางโรงเรียนทำได้ไม่จำกัด ห้ามทำงานก่อนคอร์สเริ่ม', whv:'ทำงานได้ อยู่กับนายจ้างรายเดียวไม่เกิน 6 เดือน (มีข้อยกเว้นบางประเภทงาน)'}},
      {h:'🏠 ย้ายที่อยู่', p:{student:'แจ้งที่อยู่กับโรงเรียนภายใน 7 วันหลังมาถึง และภายใน 7 วันทุกครั้งที่ย้าย', whv:'อัปเดตที่อยู่ใน ImmiAccount เมื่อย้าย'}},
      {h:'🎓 การเรียน', p:{student:'ต้องลงทะเบียนเรียนต่อเนื่อง และเข้าเรียนตามเกณฑ์ของโรงเรียน (ELICOS ตรวจการเข้าเรียน) ถ้าขาดมากโรงเรียนต้องรายงาน ซึ่งอาจทำให้วีซ่าถูกยกเลิก', whv:'เรียนได้รวมไม่เกิน 4 เดือน'}},
      {h:'🩺 ประกัน', p:{student:'ต้องมีประกัน OSHC ตลอดอายุวีซ่า ห้ามขาด', whv:'ควรมีประกันสุขภาพตลอดการพำนัก'}},
      {h:'🔁 ต่อวีซ่า/เรียนต่อ', p:{student:'ถ้าจะเรียนต่อ ต้องยื่นวีซ่า 500 ใบใหม่ก่อนวีซ่าเดิมหมด ต้องมี CoE ใหม่และเงินตามเกณฑ์', whv:'ต่อเป็นปีที่ 2 ได้ถ้าทำงานเฉพาะประเภทในพื้นที่ที่กำหนดครบ 3 เดือน (ตรวจรายละเอียดในเว็บ Home Affairs)'}},
      {h:'⛔ สิ่งที่ทำให้วีซ่าถูกยกเลิก', p:{all:'ทำงานเกินชั่วโมง · ขาดเรียน/ผลการเรียนไม่ผ่าน · ประกันขาด · ให้ข้อมูลเท็จ · อยู่เกินวีซ่า · ทำผิดกฎหมาย'}},
      {h:'🧳 กักกันโรค', p:{all:'ห้ามนำอาหารสด เมล็ดพืช เนื้อสัตว์ ไข่ เข้าประเทศโดยไม่แจ้ง ถ้าไม่แน่ใจให้ "declare" ไว้ก่อน โทษปรับสูง', u:'https://www.abf.gov.au/entering-and-leaving-australia/can-you-bring-it-in'}}
    ],
    links:[
      ['วีซ่านักเรียน 500 (Home Affairs)','https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500'],
      ['วีซ่า Work and Holiday 462','https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462'],
      ['ค่าวีซ่าปัจจุบัน','https://immi.homeaffairs.gov.au/visas/getting-a-visa/fees-and-charges/current-visa-pricing'],
      ['Study Australia (ค่าครองชีพ/สิทธิ์ทำงาน)','https://www.studyaustralia.gov.au'],
      ['ค้นหาโรงเรียน/คอร์ส CRICOS','https://cricos.education.gov.au'],
      ['สิทธิ์แรงงาน (Fair Work)','https://www.fairwork.gov.au/find-help-for/visa-holders-and-migrants']
    ],
    embassy:[
      {n:'สถานเอกอัครราชทูต ณ กรุงแคนเบอร์รา', tel:'+61262060100', show:'+61 2 6206 0100', em:'+61402735642', ems:'+61 402 735 642', a:'111 Empire Circuit, Yarralumla ACT 2600', u:'https://canberra.thaiembassy.org'},
      {n:'สถานกงสุลใหญ่ ณ นครซิดนีย์', tel:'+61292412542', show:'+61 2 9241 2542', em:'+61411424303', ems:'+61 411 424 303', a:'Level 8, 131 Macquarie St, Sydney NSW 2000', u:'https://sydney.thaiembassy.org'}
    ],
    facts:{funds:'AUD 29,710/ปี', workS:'48 ชม./2 สัปดาห์', fee:'AUD 2,050 (ELICOS)', whv:'462 · ถูกพักรับสมัคร (ส.ค.–ก.ย. 2026)'}
  },

  NZ:{
    f:'🇳🇿', n:'นิวซีแลนด์', c:'NZD', e:['111','111'], tz:'Pacific/Auckland',
    cities:{
      akl:{n:'โอ๊คแลนด์', rentW:290, livM:1050}, wlg:{n:'เวลลิงตัน', rentW:270, livM:1000},
      chc:{n:'ไครสต์เชิร์ช', rentW:230, livM:950}, ham:{n:'แฮมิลตัน', rentW:220, livM:900}
    },
    visas:{
      student:{
        n:'Fee Paying Student Visa', ok:true,
        tuitionW:380, enrol:300, ins:700, fee:750, feeNote:'ประมาณ NZD 750 (ขึ้นกับสัญชาติ/ช่องทาง) ตรวจราคาจริงในเว็บ INZ',
        funds:20000, fundsNote:'NZD 20,000 ต่อปีการศึกษา (หรือ NZD 1,667/เดือนถ้าเรียนน้อยกว่า 1 ปี) ไม่รวมค่าเรียน + ต้องมีตั๋วขากลับหรือเงินซื้อตั๋ว',
        studyMax:0, workH:25,
        work:'นักเรียนภาษาทำงานได้ 25 ชม./สัปดาห์ (เพิ่มจาก 20 ตั้งแต่ 3 พ.ย. 2025) ถ้าคอร์สเต็มเวลาอย่างน้อย 14 สัปดาห์ติดต่อกันกับมหาวิทยาลัยหรือโรงเรียน NZQA Category 1 หรือคอร์ส 24 สัปดาห์ขึ้นไปพร้อมผลสอบภาษาตามเกณฑ์ ดูสิทธิ์จริงที่ eVisa',
        tasks:[
          {id:'nz_s_school', d:-210, t:'เลือกโรงเรียนภาษาที่เป็น NZQA Category 1', x:'มีผลต่อสิทธิ์ทำงาน — ถามโรงเรียนให้ชัดว่าคอร์สที่ลงได้สิทธิ์ทำงานหรือไม่', u:'https://www.nzqa.govt.nz'},
          {id:'nz_s_offer', d:-160, t:'รับ Offer of Place จากโรงเรียน', x:'ใช้ยื่นวีซ่า ค่าเรียนจ่ายหลังได้ Approval in Principle (AIP)'},
          {id:'nz_s_xray', d:-140, t:'ตรวจ X-ray ปอด/สุขภาพ (ถ้าอยู่เกิน 6 เดือน)', x:'ใช้โรงพยาบาลที่ INZ รับรอง (panel physician) ผลต้องไม่เก่าเกินกำหนด'},
          {id:'nz_s_apply', d:-120, t:'ยื่นวีซ่านักเรียนออนไลน์', x:'แนบหลักฐานเงิน NZD 20,000/ปี และที่มาของเงิน', u:'https://immigration.govt.nz/process-to-apply/applying-for-a-visa/providing-evidence-and-documents-to-support-your-visa-application/student-fund-requirements/'},
          {id:'nz_s_fee', d:-100, t:'จ่ายค่าเรียนหลังได้ AIP แล้วส่งใบเสร็จให้ INZ', x:'INZ จะออกวีซ่าหลังได้หลักฐานจ่ายค่าเรียน'},
          {id:'nz_s_ins', d:-90, t:'ซื้อประกันสุขภาพนักเรียนต่างชาติ', x:'โรงเรียนกำหนดให้ต้องมีประกันที่ตรงเกณฑ์ตลอดการเรียน'}
        ]
      },
      whv:{
        n:'Thailand Working Holiday Visa', ok:true,
        status:'ไทยได้ปีละ 100 คน · ต้องมีวุฒิระดับอุดมศึกษา และหนังสือรับรองจากกรมกิจการเด็กและเยาวชน',
        tuitionW:380, enrol:300, ins:800, fee:770, feeNote:'จากหน้า INZ: "From NZD 770"',
        funds:7000, fundsNote:'อย่างน้อย NZD 7,000 สำหรับค่าครองชีพ บวกค่าตั๋วออกนอกประเทศ',
        studyMax:26, workH:38,
        work:'ทำงานชั่วคราวได้ทั้งปี แต่อยู่กับนายจ้างรายเดียวได้ไม่เกิน 3 เดือน ห้ามรับงานประจำ เรียน/อบรมได้รวมไม่เกิน 6 เดือน',
        age:'อายุ 18–30 ปี',
        tasks:[
          {id:'nz_w_eng', d:-240, t:'เตรียมหลักฐานภาษาอังกฤษ', x:'ผลสอบอายุไม่เกิน 2 ปี หรือหลักฐานเรียนเป็นภาษาอังกฤษตามเกณฑ์'},
          {id:'nz_w_dcy', d:-200, t:'ขอหนังสือรับรองจากกรมกิจการเด็กและเยาวชน', x:'INZ จะขอเอกสารนี้ตอนยื่น', u:'https://www.dcy.go.th'},
          {id:'nz_w_apply', d:-150, t:'ยื่นวีซ่า Working Holiday (มี 100 ที่/ปี)', x:'ยื่นออนไลน์ 80% ได้ผลภายใน 2 สัปดาห์ อาจขอ X-ray/ตรวจสุขภาพ', u:'https://immigration.govt.nz/visas/thailand-working-holiday-visa'},
          {id:'nz_w_ins', d:-90, t:'ซื้อประกันสุขภาพและรักษาพยาบาลเต็มระยะเวลา', x:'เป็นเงื่อนไขของวีซ่า'}
        ]
      }
    },
    arrival:[
      {id:'nz_a_sim', t:'ซื้อซิมโทรศัพท์', x:'ซื้อได้ที่สนามบินหรือซูเปอร์มาร์เก็ต'},
      {id:'nz_a_bank', t:'เปิดบัญชีธนาคาร', x:'ใช้พาสปอร์ต วีซ่า และหลักฐานที่อยู่ (หรือจดหมายจากโรงเรียน)'},
      {id:'nz_a_ird', t:'ขอ IRD number (เลขภาษี)', x:'ต้องมีก่อนเริ่มทำงาน ไม่งั้นถูกหักภาษีอัตราสูง', u:'https://www.ird.govt.nz'},
      {id:'nz_a_addr', t:'แจ้งที่อยู่ปัจจุบันกับโรงเรียน', x:'แจ้งทุกครั้งที่ย้าย โรงเรียนต้องมีข้อมูลติดต่อนักเรียนต่างชาติที่เป็นปัจจุบัน', who:'student'},
      {id:'nz_a_ins', t:'ตรวจว่าประกันเริ่มคุ้มครองแล้ว', x:'เก็บเลขกรมธรรม์ในการ์ดฉุกเฉิน'},
      {id:'nz_a_gp', t:'ลงทะเบียนกับคลินิกแพทย์ (GP)', x:'บางคลินิกรับผู้ป่วยใหม่จำกัด ลงทะเบียนไว้ก่อนป่วย'},
      {id:'nz_a_transport', t:'ทำบัตรโดยสาร', x:'เช่น AT HOP (โอ๊คแลนด์) Snapper (เวลลิงตัน) Metrocard (ไครสต์เชิร์ช)'},
      {id:'nz_a_house', t:'หาที่พักระยะยาว', x:'มัดจำ (bond) ต้องฝากกับ Tenancy Services ขอใบเสร็จทุกครั้ง'}
    ],
    rules:[
      {h:'⏱ ทำงานพิเศษ', p:{student:'25 ชม./สัปดาห์ ถ้าคอร์สเข้าเกณฑ์ (ดูสิทธิ์ที่ระบุใน eVisa เท่านั้น) ห้ามทำงานอิสระ/รับจ้างเอง ต้องมีนายจ้างและสัญญาจ้าง', whv:'ทำงานชั่วคราวได้ นายจ้างรายเดียวไม่เกิน 3 เดือน ห้ามรับงานประจำ'}},
      {h:'🏠 ย้ายที่อยู่', p:{student:'แจ้งโรงเรียนทุกครั้งที่ย้าย', whv:'อัปเดตข้อมูลติดต่อกับ INZ เมื่อเปลี่ยน'}},
      {h:'🎓 การเรียน', p:{student:'ต้องเรียนเต็มเวลาตามคอร์สที่ได้วีซ่า ถ้าเปลี่ยนโรงเรียน/คอร์สต้องขอเปลี่ยนเงื่อนไขวีซ่าก่อน', whv:'เรียน/อบรมรวมไม่เกิน 6 เดือน'}},
      {h:'🔁 ต่อวีซ่า', p:{student:'ยื่นวีซ่านักเรียนใบใหม่ออนไลน์ก่อนวีซ่าเดิมหมด ต้องมี Offer ใหม่ หลักฐานเงิน และประกัน', whv:'วีซ่านี้ต่อไม่ได้ และขอได้ครั้งเดียวในชีวิต'}},
      {h:'⛔ สิ่งที่ทำให้วีซ่าถูกยกเลิก', p:{all:'ทำงานโดยไม่มีสิทธิ์หรือเกินชั่วโมง · ไม่เข้าเรียน · ให้ข้อมูลเท็จ · อยู่เกินวีซ่า · ทำผิดกฎหมาย — อาจถูกส่งกลับและมีผลกับวีซ่าครั้งต่อไป'}},
      {h:'🧳 กักกันโรค', p:{all:'นิวซีแลนด์เข้มงวดมาก ต้องแจ้งอาหาร พืช ของจากสัตว์ทุกชนิด ไม่แจ้งปรับทันที', u:'https://www.mpi.govt.nz/bring-send-to-nz/'}}
    ],
    links:[
      ['สิทธิ์ทำงานของนักเรียน (INZ)','https://www.immigration.govt.nz/study/study-visas/working-on-a-student-visa/'],
      ['เงินที่ต้องแสดงสำหรับนักเรียน','https://immigration.govt.nz/process-to-apply/applying-for-a-visa/providing-evidence-and-documents-to-support-your-visa-application/student-fund-requirements/'],
      ['Thailand Working Holiday Visa','https://immigration.govt.nz/visas/thailand-working-holiday-visa'],
      ['ค้นหาโรงเรียน (NZQA)','https://www.nzqa.govt.nz'],
      ['ภาษี/IRD number','https://www.ird.govt.nz']
    ],
    embassy:[
      {n:'สถานเอกอัครราชทูต ณ กรุงเวลลิงตัน', tel:'', show:'ดูเบอร์สำนักงานในเว็บ', em:'+6421896292', ems:'+64 21 896 292', a:'110 Molesworth Street, Thorndon, Wellington 6011', u:'https://wellington.thaiembassy.org'}
    ],
    facts:{funds:'NZD 20,000/ปี', workS:'25 ชม./สัปดาห์ (ถ้าคอร์สเข้าเกณฑ์)', fee:'~NZD 750', whv:'มี · 100 ที่/ปี · NZD 770'}
  },

  CA:{
    f:'🇨🇦', n:'แคนาดา', c:'CAD', e:['911','911'], tz:'America/Toronto',
    cities:{
      van:{n:'แวนคูเวอร์', rentW:300, livM:1050}, tor:{n:'โทรอนโต', rentW:290, livM:1050},
      cal:{n:'แคลการี', rentW:230, livM:950}, mtl:{n:'มอนทรีออล', rentW:210, livM:950}, vic:{n:'วิกตอเรีย', rentW:270, livM:1000}
    },
    visas:{
      student:{
        n:'Study permit', ok:true,
        tuitionW:360, enrol:250, ins:900, fee:235, feeNote:'ค่า study permit CAD 150 + สแกนนิ้ว CAD 85 (ค่าประมาณ ตรวจในเว็บ IRCC)',
        funds:23448, fundsNote:'ค่าครองชีพที่ต้องแสดงสำหรับคำร้องที่ยื่นตั้งแต่ 1 ก.ย. 2026 (นอกควิเบก) ไม่รวมค่าเรียนปีแรกและค่าเดินทาง',
        studyMax:0, workH:0,
        work:'❌ ถ้าเรียนภาษา (ESL/FSL) อย่างเดียว ทำงานนอกโรงเรียนไม่ได้ (บางโรงเรียนในมหาวิทยาลัยให้ทำงานในแคมปัสได้ถ้า study permit ระบุสิทธิ์) — วางงบโดยไม่นับรายได้',
        tasks:[
          {id:'ca_s_school', d:-240, t:'เลือกโรงเรียนภาษาที่อยู่ในรายชื่อ DLI', x:'Study permit ใช้ได้กับสถาบันที่เป็น Designated Learning Institution เท่านั้น ถามโรงเรียนด้วยว่าต้องใช้ PAL หรือไม่', u:'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html'},
          {id:'ca_s_loa', d:-180, t:'จ่ายค่าเรียนและรับ Letter of Acceptance', x:'ใช้ยื่น study permit'},
          {id:'ca_s_funds', d:-160, t:'เตรียมหลักฐานเงิน CAD 23,448 + ค่าเรียนปีแรก + ค่าเดินทาง', x:'เงินต้องพร้อมใช้จริง ห้ามกู้มาแสดง', u:'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html'},
          {id:'ca_s_med', d:-150, t:'ตรวจสุขภาพกับแพทย์ที่ IRCC รับรอง (ถ้ากำหนด)', x:'คนที่อยู่เกิน 6 เดือนจากบางประเทศต้องตรวจ ตรวจรายชื่อแพทย์ panel ในไทย'},
          {id:'ca_s_apply', d:-140, t:'ยื่น study permit ออนไลน์ + สแกนนิ้ว', x:'ได้วีซ่าเข้าประเทศ (TRV) พร้อมกัน ตัว study permit ออกที่ด่านตอนเข้าประเทศ', u:'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html'},
          {id:'ca_s_ins', d:-60, t:'เช็กประกันสุขภาพตามมณฑล', x:'บางมณฑลให้นักเรียนเข้าระบบรัฐได้หลังรอระยะหนึ่ง บางมณฑลต้องซื้อประกันเอกชน ถามโรงเรียน'}
        ]
      },
      whv:{
        n:'Working Holiday (IEC)', ok:false,
        status:'❌ ไทยไม่อยู่ในโครงการ International Experience Canada จึงไม่มีวีซ่า Working Holiday สำหรับคนไทย',
        tuitionW:0, enrol:0, ins:0, fee:0, funds:0, studyMax:0, workH:0, work:'ไม่มีสำหรับคนไทย', tasks:[]
      }
    },
    arrival:[
      {id:'ca_a_permit', t:'ตรวจ study permit ที่ได้จากด่านทันที', x:'ชื่อ วันหมดอายุ และเงื่อนไขการทำงานต้องถูกต้อง ถ้าผิดให้แก้ก่อนออกจากด่าน', who:'student'},
      {id:'ca_a_sim', t:'ซื้อซิมโทรศัพท์', x:'ค่ายเล็กราคาถูกกว่าค่ายใหญ่ เทียบแพ็กเกจก่อน'},
      {id:'ca_a_bank', t:'เปิดบัญชีธนาคาร', x:'ธนาคารใหญ่มีแพ็กเกจนักเรียนต่างชาติ ใช้พาสปอร์ตและ study permit'},
      {id:'ca_a_health', t:'สมัครประกันสุขภาพตามมณฑล', x:'เช่น BC ต้องสมัคร MSP และซื้อประกันเอกชนช่วงรอ ส่วนออนแทรีโอต้องใช้ประกันเอกชน/ของโรงเรียน'},
      {id:'ca_a_addr', t:'แจ้งที่อยู่กับโรงเรียน และอัปเดตกับ IRCC เมื่อย้าย', x:'ใช้แบบฟอร์มออนไลน์ของ IRCC'},
      {id:'ca_a_sin', t:'ขอ SIN (เฉพาะถ้า study permit ให้สิทธิ์ทำงาน)', x:'นักเรียนภาษาอย่างเดียวส่วนใหญ่ไม่มีสิทธิ์ทำงานนอกโรงเรียน', u:'https://www.canada.ca/en/employment-social-development/services/sin.html'},
      {id:'ca_a_transport', t:'ทำบัตรโดยสาร', x:'เช่น Compass (แวนคูเวอร์) PRESTO (โทรอนโต) OPUS (มอนทรีออล)'},
      {id:'ca_a_winter', t:'เตรียมเสื้อผ้าฤดูหนาว', x:'ซื้อที่แคนาดาได้ ถูกและเหมาะกับอากาศกว่า'}
    ],
    rules:[
      {h:'⏱ ทำงานพิเศษ', p:{student:'ถ้าเรียน ESL/FSL อย่างเดียว ทำงานนอกโรงเรียนไม่ได้ ส่วนนักเรียนหลักสูตรที่เข้าเกณฑ์ทำได้ 24 ชม./สัปดาห์ — ทำงานโดยไม่มีสิทธิ์ผิดเงื่อนไขร้ายแรง'}},
      {h:'🏠 ย้ายที่อยู่', p:{student:'แจ้งโรงเรียน และอัปเดตที่อยู่กับ IRCC ผ่านแบบฟอร์มออนไลน์'}},
      {h:'🎓 การเรียน', p:{student:'ต้องลงทะเบียนเรียนที่ DLI และเรียนอย่างต่อเนื่อง (actively pursue studies) ถ้าเปลี่ยนโรงเรียนต้องแจ้ง IRCC'}},
      {h:'🔁 ต่อ study permit', p:{student:'ยื่นต่อออนไลน์ก่อนหมดอายุ (แนะนำล่วงหน้าอย่างน้อย 30 วัน) ถ้ายื่นทันก่อนหมด อยู่ต่อได้ระหว่างรอผล ต้องแสดงเงินตามเกณฑ์ใหม่', u:'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/extend-study-permit.html'}},
      {h:'📅 กฎ 6 เดือน', p:{student:'เรียนไม่เกิน 6 เดือนเข้าแบบนักท่องเที่ยวได้ แต่เรียนเกิน 6 เดือนต้องมี study permit และต่อเวลาในฐานะนักท่องเที่ยวเพื่อเรียนต่อไม่ได้', u:'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/operational-bulletins-manuals/temporary-residents/study-permits/who-needs-study-permit.html'}},
      {h:'⛔ สิ่งที่ทำให้วีซ่าถูกยกเลิก', p:{all:'ทำงานโดยไม่มีสิทธิ์ · ไม่เรียน/ลาออกจากโรงเรียน · อยู่เกิน study permit · ให้ข้อมูลเท็จ · ทำผิดกฎหมาย'}}
    ],
    links:[
      ['Study permit (IRCC)','https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html'],
      ['หลักฐานการเงิน (Proof of financial support)','https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html'],
      ['การทำงานนอกโรงเรียน','https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/work-off-campus.html'],
      ['ต่อ study permit','https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/extend-study-permit.html'],
      ['รายชื่อสถาบัน DLI','https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html']
    ],
    embassy:[
      {n:'สถานเอกอัครราชทูต ณ กรุงออตตาวา', tel:'+16137224444', show:'+1 613 722 4444', em:'+16138532650', ems:'+1 613 853 2650', a:'180 Island Park Drive, Ottawa ON K1Y 0A2', u:'https://ottawa.thaiembassy.org'},
      {n:'สถานกงสุลใหญ่ ณ นครแวนคูเวอร์', tel:'', show:'ดูเบอร์สำนักงานในเว็บ', em:'+17789849055', ems:'+1 778 984 9055', a:'', u:'https://ottawa.thaiembassy.org'}
    ],
    facts:{funds:'CAD 23,448/ปี', workS:'❌ นักเรียนภาษาทำงานนอกโรงเรียนไม่ได้', fee:'~CAD 235', whv:'❌ ไม่มีสำหรับคนไทย'}
  }
};

const SOS_PHRASES = [
  ['ช่วยด้วย','Help, please!'],
  ['ฉันต้องการไปโรงพยาบาล','I need to go to the hospital.'],
  ['กรุณาโทรเรียกรถพยาบาล','Please call an ambulance.'],
  ['ฉันแพ้ยา/อาหารชนิดนี้','I am allergic to this.'],
  ['พาสปอร์ตของฉันหาย','I lost my passport.'],
  ['ฉันเป็นนักเรียนจากประเทศไทย','I am a student from Thailand.'],
  ['ช่วยติดต่อสถานทูตไทยให้หน่อย','Please contact the Thai embassy for me.'],
  ['ฉันพูดภาษาอังกฤษได้ไม่ดี กรุณาพูดช้าๆ','My English is not good. Please speak slowly.']
];
