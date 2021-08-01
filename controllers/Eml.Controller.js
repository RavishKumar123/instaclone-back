// IMPORTS USED FOR PARSING EML FILE
const url = require("url");
const http = require("http");
const https = require("https");
const sizeOf = require("image-size");
const simpleParser = require("mailparser").simpleParser;
const sharp = require("sharp");
const nodeHtmlToImage = require("node-html-to-image");
const got = require("got");
const FileType = require("file-type");
const fs = require("fs");
const isImageURL = require("image-url-validator").default;
const requestImageSize = require("request-image-size");

//Post Add Imports
const Post = require("../models/Post.model");
const PostVotes = require("../models/PostVote.model");
const Brand = require("../models/Brand.model");
const BrandUser = require("../models/BrandUser.model");
const Content = require("../models/Content.model");
const { validationResult } = require("express-validator");
const { retriveComments } = require("../utils/controllerUtils");

const isUrlSuitable = (link) => {
  if (
    link.includes(".jpg") ||
    link.includes(".png") ||
    link.includes(".jpeg") ||
    link.includes(".gif")
  ) {
    return true;
  } else {
    return false;
  }
};
async function checkUrlType(link) {
  try {
    const stream = got.stream(link.toString());
    var type = await FileType.fromStream(stream);
    if (isUrlSuitable(type.ext)) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
}
const httpGet = (url, htp) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    htp
      .get(url, (res) => {
        // res.setEncoding('utf8');
        let body = "";
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(chunks));
      })
      .on("error", reject);
  });
};
const getSize = (buffer) => {
  return new Promise((resolve, reject) => {
    if (buffer) {
      const size = sizeOf(buffer);
      resolve(size);
    } else {
      reject({});
    }
  });
};
const getBuffer = (chunks) => {
  return new Promise((resolve, reject) => {
    if (chunks.length > 0) {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    } else {
      reject([]);
    }
  });
};

const splitEmail = (email) => {
  // const splits = email.split(".");
  // const splitLength = splits.length;
  // const brandName = splits[splitLength - 2];

  // const strEmail = email.split("@");
  // const strDomain1 = strEmail[1].split(".")[0];
  // const strDomain2 = strEmail[1].split(".")[1];
  // var strDomain = "";
  // if (!strDomain2.includes("com")) {
  //   strDomain = strDomain1 + "-" + strDomain2;
  // } else {
  //   strDomain = strDomain1;
  // }
  // return {
  //   strDomain: strDomain,
  //   domain: strEmail[1],
  //   name: strEmail[0],
  //   brandName,
  // };
  const splits = email.split("@");
  const split_brand_user = splits[0];
  const split_right = splits[1].split(".");
  const split_right_length = split_right.length;
  const split_brand_Name = split_right[split_right_length - 2];
  const split_domain = splits[1];
};

const getValidatedUrls = (urls, htp) => {
  var unResponsiveLinks = [];
  var validatedUrls = [];
  return new Promise(function (resolve, reject) {
    if (urls.length > 0) {
      var rowLen = urls.length;
      var count = 0;
      urls.map((link, i) => {
        isImageURL(link)
          .then((res) => {
            if (res) {
              console.log("LINKING", link);
              httpGet(link.toString(), htp)
                .then((chunks) => {
                  getBuffer(chunks)
                    .then((buffer) => {
                      getSize(buffer)
                        .then((size) => {
                          console.log("STARTING", link);
                          count++;
                          console.log(size);
                          console.log("Length", rowLen);
                          console.log("count", count);
                          validatedUrls.push({
                            url: link,
                            width: sizeOf(buffer).width,
                            height: sizeOf(buffer).height,
                          });
                          if (count == rowLen) {
                            resolve({
                              validated: validatedUrls,
                              unresponsive: unResponsiveLinks,
                            });
                          }
                        })
                        .catch((err) => {
                          console.log(
                            "An Error occured while preocessing :: ",
                            link
                          );
                          console.log("ERROR IS :: ", err);
                          rowLen--;
                          unResponsiveLinks.push(link);
                          console.log("IN CATCH OF GETSIZE PROMICE");
                          console.log("Length", rowLen);
                          console.log("count", count);
                          if (count == rowLen) {
                            resolve({
                              validated: validatedUrls,
                              unresponsive: unResponsiveLinks,
                            });
                          }
                        });
                    })
                    .catch((err) => {
                      console.log(
                        "An Error occured while preocessing :: ",
                        link
                      );
                      console.log("ERROR IS :: ", err);
                      rowLen--;
                      unResponsiveLinks.push(link);
                      console.log("IN CATCH OF GETBUFFER PROMICE");
                      console.log("Length", rowLen);
                      console.log("count", count);
                      if (count == rowLen) {
                        resolve({
                          validated: validatedUrls,
                          unresponsive: unResponsiveLinks,
                        });
                      }
                    });
                })
                .catch((err) => {
                  console.log("An Error occured while preocessing :: ", link);
                  console.log("ERROR IS :: ", err);
                  rowLen--;
                  unResponsiveLinks.push(link);
                  console.log("IN CATCH");
                  console.log("Length", rowLen);
                  console.log("count", count);
                  if (count == rowLen) {
                    resolve({
                      validated: validatedUrls,
                      unresponsive: unResponsiveLinks,
                    });
                  }
                });
            } else {
              console.log("An Error occured while preocessing :: ", link);
              console.log("ERROR IS :: ", err);
              rowLen--;
              unResponsiveLinks.push(link);
              console.log("IN ELSE OF IMAGEVALIDATOR");
              console.log("Length", rowLen);
              console.log("count", count);
              if (count == rowLen) {
                resolve({
                  validated: validatedUrls,
                  unresponsive: unResponsiveLinks,
                });
              }
            }
          })
          .catch((err) => {
            console.log("An Error occured while preocessing :: ", link);
            console.log("ERROR IS :: ", err);
            rowLen--;
            unResponsiveLinks.push(link);
            console.log("IN CATCH OF IMAGEVALIDATOR");
            console.log("Length", rowLen);
            console.log("count", count);
            if (count == rowLen) {
              resolve({
                validated: validatedUrls,
                unresponsive: unResponsiveLinks,
              });
            }
          });
      });
    } else {
      resolve({ validated: validatedUrls, unresponsive: unResponsiveLinks });
    }
  });
};

const addPost = async (
  subject,
  email,
  content,
  image,
  received_at,
  content_id
) => {
  try {
    fs.appendFile(`./contents/${content_id}.txt`, content, (err) => {
      if (err) throw err;
    });
    const storeContent = new Content({
      content: content_id,
    });

    const saved = await storeContent.save();
    const strEmail = email.split("@");

    const splits = email.split("@");
    const split_brand_user = splits[0];
    const split_right = splits[1].split(".");
    const split_right_length = split_right.length;
    const split_brand_Name = split_right[split_right_length - 2];
    const split_domain = splits[1];

    // const splits = splitEmail(email);
    // const strDomain = splits.strDomain;
    const brand = await Brand.findOne({ domain: split_domain });
    const brand_user = await BrandUser.findOne({ name: split_brand_user, email });
    if (!brand) {
      const newBrand = new Brand({
        domain: split_domain,
        name: split_brand_Name,
        description: "",
        affilate_link: "",
        avatar:
          "https://www.pikpng.com/pngl/m/383-3833925_brand-icon-brazil-flag-clipart.png",
      });
      const success = await newBrand.save();
      if (!brand_user) {
        const newBrandUser = new BrandUser({
          name: split_brand_user,
          email: email,
          brand_id: success._id,
        });
        const successBrandUser = await newBrandUser.save();
        const post = new Post({
          domain: split_brand_Name, // its brandname actually will fix it soon
          subject,
          email,
          brand_id: success._id,
          brand_user_id: successBrandUser._id,
          content: saved._id,
          image: image,
          received_at,
        });
        const postSuccess = await post.save();
        const postVote = new PostVotes({
          post: postSuccess._id,
        });
        await postVote.save();
        console.log("Post successfully saved");
        return true;
      }
    }
    if (!brand_user) {
      const newBrandUser = new BrandUser({
        name: split_brand_user,
        email: email,
        brand_id: brand._id,
      });
      const successBrandUser = await newBrandUser.save();
      const post = new Post({
        domain: split_brand_Name,
        subject,
        email,
        brand_id: brand._id,
        brand_user_id: successBrandUser._id,
        content: saved._id,
        image: image,
        received_at,
      });
      const postSuccess = await post.save();
      const postVote = new PostVotes({
        post: postSuccess._id,
      });
      await postVote.save();
      console.log("Post successfully saved");
      return true;
    }
    const post = new Post({
      domain: split_brand_Name,
      subject,
      email,
      brand_id: brand._id,
      brand_user_id: brand_user._id,
      content: saved._id,
      image: image,
      received_at,
    });
    const postSuccess = await post.save();
    const postVote = new PostVotes({
      post: postSuccess._id,
    });
    await postVote.save();
    return true;
    // return res.status(200).json({
    //     ...post.toObject(),
    //     postVotes: [],
    //     comments: [],
    //     author: { avatar: "", name: brand_user.name }
    // })
  } catch (error) {
    console.log("error: ", error);
  }
};

exports.parseEml = async (req, res) => {
  try {
    const file = req.body.file;
    // const url = `${req.protocol}://${req.headers.host}/${pathname}`,
    const buff = Buffer.from(file, "utf-8");
    console.log("****************************");
    console.log("RECIEVED .EML BUFFER");
    console.log("****************************");
    console.log("STARTING PARSING...");
    let parsed = await simpleParser(buff);
    console.log("****************************");
    console.log("PARSING COMPLETED");
    console.log("****************************");
    const EML_HTML = parsed.html.toString();
    console.log("GENERATING IMAGE FROM HTML...");
    var m,
      http_urls = [],
      https_urls = [],
      http_rex = /<img[^>]+src="(http:\/\/[^">]+)"/g,
      https_rex = /<img[^>]+src="(https:\/\/[^">]+)"/g,
      ALL_URLS = [];

    while ((m = http_rex.exec(EML_HTML))) {
      const URL = m[1];
      if (true) http_urls.push(URL);
    }

    while ((m = https_rex.exec(EML_HTML))) {
      const URL = m[1];
      if (true) https_urls.push(URL);
    }

    console.log("LENGTH OF HTTP URLS ::", http_urls.length);
    console.log("HTTP URLS ::", http_urls);

    console.log("LENGTH OF HTTPS URLS ::", https_urls.length);
    console.log("HTTPS URLS ::", https_urls);
    getValidatedUrls(http_urls, http)
      .then((httpResponse) => {
        console.log("TOTAL VALIDATED HTTP URLS", httpResponse.validated);
        console.log("TOTAL UNRESPONSIVE HTTP URLS", httpResponse.unresponsive);
        getValidatedUrls(https_urls, https).then((httpsResponse) => {
          console.log("TOTAL VALIDATED HTTPs URLS", httpsResponse.validated);
          console.log(
            "TOTAL UNRESPONSIVE HTTPs URLS",
            httpsResponse.unresponsive
          );
          var allUrls = [];
          if (httpsResponse.unresponsive.length > 0) {
            allUrls = httpsResponse.validated.concat(httpResponse.validated);
          } else {
            allUrls = httpResponse.validated.concat(httpsResponse.validated);
          }

          console.log("allUrls", allUrls);
          var max = -Infinity;
          var key;
          allUrls.forEach(function (v, k) {
            if (max < +v.height) {
              max = +v.height;
              key = k;
            }
          });
          const tallestImage = allUrls[key];
          console.log("Tallest image", tallestImage);
          if (tallestImage != undefined) {
            var request = require("request").defaults({ encoding: null });
            request.get(tallestImage.url, function (err, rest, body) {
              if (body != undefined) {
                sharp(body)
                  .resize(500, 800)
                  .toFile(`images/${req.body.content_id}.jpg`, (err, info) => {
                    console.log("ERROR", err);
                    console.log("MAIN IMAGE GENERATED");
                    console.log("GENERATINH HTML IMAGE...");
                    console.log("IMAGE GENERATED SUCCESSFULLY");
                    addPost(
                      parsed.subject,
                      parsed.from.value[0].address,
                      EML_HTML,
                      (image = `${req.protocol}://${req.headers.host}/images/${req.body.content_id}.jpg`),
                      parsed.date,
                      req.body.content_id
                    )
                      .then((x) => {
                        console.log("then called", x);
                        return res.send({
                          success: true,
                          subject: parsed.subject,
                          email: parsed.from.value[0].address,
                          received_at: parsed.date,
                        });
                      })
                      .catch((y) => {
                        console.log("Catch called", y);
                        return res
                          .status(500)
                          .json({ success: false, subject: parsed.subject });
                      });
                    // console.log("HTML IMAGE GENERATED");
                  });
              }
            });
          } else {
            console.log("Contentid", req.body.content_id);
            nodeHtmlToImage({
              output: `images/custom${req.body.content_id}.jpg`,
              html: `
              <html>
              <head>
              <title>Custom Image</title>
              <style>
              #customContainer {
              background-color: black;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              color: white;
              height: 900px;
              margin: auto;
              font-family: Arial, Helvetica, sans-serif;
              }
              #customContainer h1 {
              font-size: 5rem;
              margin: 0;
              }
              #customContainer h3 {
              font-size: 2rem;
              margin: 3px;
              font-weight: 100;
              width:90%;
              }
              #custominner {
              width: 70%;
              margin: auto;
              text-align: left;
              }
              </style>
              </head>
              <body>
              <div id="customContainer">
              <div id="custominner">
              <h1>${splitEmail(parsed.from.value[0].address).brandName}</h1>
              <h3>
              ${parsed.subject}
              </h3>
              </div>
              </div>
              </body>
              </html>

`,
              content: { name: "you" },
            })
              .then((result) => {
                console.log("IMAGE GENERATED SUCCESSFULLY", result);
                if (result !== undefined) {
                  sharp(result)
                    .resize(500, 800)
                    .toFile(
                      `images/${req.body.content_id}.jpg`,
                      (err, info) => {
                        console.log("ERROR", err);
                        console.log("MAIN IMAGE GENERATED");
                        console.log("GENERATINH HTML IMAGE...");
                        console.log("IMAGE GENERATED SUCCESSFULLY");
                        addPost(
                          parsed.subject,
                          parsed.from.value[0].address,
                          EML_HTML,
                          (image = `${req.protocol}://${req.headers.host}/images/${req.body.content_id}.jpg`),
                          parsed.date,
                          req.body.content_id
                        )
                          .then((x) => {
                            console.log("then called", x);
                            return res.send({
                              success: true,
                              subject: parsed.subject,
                              email: parsed.from.value[0].address,
                              received_at: parsed.date,
                            });
                          })
                          .catch((y) => {
                            console.log("Catch called", y);
                            return res.status(500).json({
                              success: false,
                              subject: parsed.subject,
                            });
                          });
                        // console.log("HTML IMAGE GENERATED");
                      }
                    );
                }
              })
              .catch((err) => {
                return res.status(500).json({ success: false });
              });
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false });
  }
};
