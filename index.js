const express = require("express");
const path = require("path");
// const favicon=require("serve-favicon")
// const axios = require("axios");
const fs = require("fs");
const multer = require('multer');
const officeParser = require('officeparser');
const {GoogleGenAI} = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
// // app.use(favicon(path.join(__dirname, 'public/assets/img','favicon.ico')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads');
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  });
  const upload = multer({ storage: storage,limits: { fileSize: 2000000 } ,fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }});
  function checkFileType(file, cb) {
    const filetypes = /txt|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
       cb('Error: pdf or text file only! (pdf,txt)');
     
    }
  }
app.get("/", (req, res) => {
  res.render("index");
});
// app.get("/result", async(req, res) => {
//        let data=`This ultrasound report suggests Polycystic Ovarian Syndrome (PCOS) and raises the possibility of Pelvic Inflammatory Disease (PID) due to the fluid in the Pouch of Douglas (POD). Here's a breakdown of recommended next steps:

// **1. Immediate Doctor Consultation (Gynecologist):** This is crucial. The report *suggests* PCOS and PID, but these are not definitive diagnoses based on ultrasound alone. A gynecologist will:

// * **Review Medical History:**  Discuss menstrual cycles, pain, any unusual discharge, sexual history, and other relevant symptoms. Irregular periods, acne, hirsutism (excess hair growth), and weight gain are common with PCOS.  Pain, fever, and abnormal discharge can point towards PID.
// * **Physical Examination:** A pelvic exam is necessary to assess for tenderness, masses, or signs of infection.
// * **Order Further Investigations:** The ultrasound has flagged potential issues, but further tests are required for confirmation and a complete picture.

// **2. Further Investigations (Likely Recommended by Gynecologist):**

// * **Blood Tests:**
//     * **Hormone Profile:**  Measuring levels of LH, FSH, testosterone, estradiol, prolactin, and thyroid hormones will help confirm PCOS and rule out other hormonal imbalances.  An AMH (Anti-Mullerian Hormone) test can also be helpful in assessing ovarian reserve in PCOS.      
//     * **Inflammatory Markers (CRP, ESR):** Elevated levels can suggest PID.
//     * **STI Testing (Chlamydia and Gonorrhea):** These are common causes of PID and should be ruled out.

// * **Transvaginal Ultrasound (TVUS):** While the transabdominal ultrasound provided some information, a TVUS offers a clearer view of the pelvic organs and can better assess the ovaries and POD fluid.  It's often preferred for evaluating suspected PCOS and PID.

// **3. Lifestyle Changes (In Consultation with the Gynecologist):**  Even before a definitive diagnosis, certain lifestyle changes can be beneficial and may improve symptoms:

// * **Diet and Exercise:**  Weight loss (even a modest 5-10%) can significantly improve PCOS symptoms and regulate menstrual cycles.  Focus on a balanced diet and regular physical activity.
// * **Stress Management:**  Stress can exacerbate hormonal imbalances. Explore stress-reducing techniques like yoga, meditation, or deep breathing exercises.

// **4. Ruling out PID:**  The fluid in the POD is concerning for PID. Addressing this promptly is crucial to prevent complications like chronic pelvic pain and infertility.  If PID is suspected, antibiotics will likely be prescribed.

// **5.  Follow-up:** After the initial consultation and further investigations, regular follow-up with the gynecologist is essential for ongoing management, particularly if PCOS is confirmed.

// **In Summary:** The patient should schedule an appointment with a gynecologist *as soon as possible*. This report is not a diagnosis, but an indication that further evaluation is urgently needed.  Early diagnosis and management of both PCOS and PID are crucial for long-term health and well-being.`

//     //    let a = data.replaceAll("* ","<br/>")
//     //    let b=a.replaceAll("**","<br/><b>")
//     //    let c=b.replaceAll("*","</b>")
//     //    console.log(a);
//     res.render("demo",{response:data});

       
// });
app.post("/submit",upload.single("myFile"), async(req, res) => {
    const config = {
        newlineDelimiter: " ",  // Separate new lines with a space instead of the default \n.
        ignoreNotes: true       // Ignore notes while parsing presentation files like pptx or odp.
    }
    console.log(req.body.flexRadioDefault);
    
    if (!req.file) {
        res.status(400).redirect("/");
        return;
        }
        
        // You can perform additional operations with the uploaded image here.
        try {
            // "data" string returned from promise here is the text parsed from the office file passed in the argument
            const data = await officeParser.parseOfficeAsync(`./uploads/${req.file.originalname}`,config);
            // data.replaceAll("&","and")
            // console.log(data);
         
            fs.unlink(`./uploads/${req.file.originalname}`,(err) => {
                if (err) {
                  console.error("Error deleting file:", err);
                } else {
                  console.log("File deleted successfully!");
                }
              })
            res.redirect(`/details?data=${encodeURIComponent(data)}&massage=${encodeURIComponent(req.body.flexRadioDefault)}`)
        } catch (err) {
            // resolve error
            console.log(err);
            res.redirect("/");
        }
});
app.get("/details", async(req, res) => {
    console.log(req.query);
    let messages = [("system",`You are a highly experienced medical expert specializing in radiology and diagnostics. I will provide you with a patient's medical report, ${req.query.data} `),("human",req.query.massage ),]
    const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: messages,
    });
    console.log(response.text);
    res.render("details",{response:response.text});
});
// app.get("/demo", async(req, res) => {
  
//     res.render("demo");
// });


app.listen(process.env.PORT, () => {
  console.log("connected..");
});
