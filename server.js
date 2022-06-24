const express = require("express");
const cors = require("cors");
const axios = require("axios").default;
const sib = require("sib-api-v3-sdk");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = express();
const defaultClient = sib.ApiClient.instance;
apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SIB_API_KEY;

const contactsApi = new sib.ContactsApi();
const privateEmailsApi = new sib.TransactionalEmailsApi();

app.use(express.json());
app.use(express.static(__dirname + "/assets"));
app.use(cors());
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", { sitekey: process.env.RECAPTCHA_SITE_KEY });
});

app.get("/abrir-email", (req, res) => {
  res.render("abrir-email");
});

app.post("/recaptcha-verification", ({ body }, res) => {
  const { login, userToken } = body;

  axios
    .post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SERVER_KEY}&response=${userToken}`
    )
    .then(({ data }) => {
      if (!data.success) {
        res.status(400).json("recaptcha failed");
        throw new Error("recaptcha failed");
      }
    })
    .then(() =>
      privateEmailsApi.sendTransacEmail({
        sender: {
          email: "dreemoraes16@gmail.com",
          name: "Alexandre",
        },
        to: [
          {
            email: login.email,
            firstName: login.name,
          },
        ],
        templateId: 6,
        params: {
          name: login.name,
        },
        headers: {
          "X-Mailin-custom":
            "custom_header_1:custom_value_1|custom_header_2:custom_value_2",
        },
      })
    )
    .then(() =>
      contactsApi.createContact({
        email: login.email,
        attributes: { firstName: login.name },
        listIds: login.listIds,
      })
    )
    .then(() => res.json("success"))
    .catch(err => {
      console.log(err);
      res.status(500).json("error has occured");
    });
});

app.listen(process.env.PORT, console.log("listening"));
