const { JSDOM } = require("jsdom");
const axios = require("axios");
const fs = require("fs");
const argumentReader = require("minimist");
const { STATES } = require("./state-constituencies");

async function fetchHTML(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    return html;
  } catch (error) {
    console.error("Error fetching HTML:", error);
    return null;
  }
}

const getAndSaveStateConstituencies = async () => {
  const STATE_CODES = [
    { code: "U01", name: "Andaman &amp; Nicobar Islands", constituencies: [] },
    { code: "S01", name: "Andhra Pradesh", constituencies: [] },
    { code: "S02", name: "Arunachal Pradesh", constituencies: [] },
    { code: "S03", name: "Assam", constituencies: [] },
    { code: "S04", name: "Bihar", constituencies: [] },
    { code: "U02", name: "Chandigarh", constituencies: [] },
    { code: "S26", name: "Chhattisgarh", constituencies: [] },
    {
      code: "U03",
      name: "Dadra &amp; Nagar Haveli and Daman &amp; Diu",
      constituencies: [],
    },
    { code: "S05", name: "Goa", constituencies: [] },
    { code: "S06", name: "Gujarat", constituencies: [] },
    { code: "S07", name: "Haryana", constituencies: [] },
    { code: "S08", name: "Himachal Pradesh", constituencies: [] },
    { code: "U08", name: "Jammu and Kashmir", constituencies: [] },
    { code: "S27", name: "Jharkhand", constituencies: [] },
    { code: "S10", name: "Karnataka", constituencies: [] },
    { code: "S11", name: "Kerala", constituencies: [] },
    { code: "U09", name: "Ladakh", constituencies: [] },
    { code: "U06", name: "Lakshadweep", constituencies: [] },
    { code: "S12", name: "Madhya Pradesh", constituencies: [] },
    { code: "S13", name: "Maharashtra", constituencies: [] },
    { code: "S14", name: "Manipur", constituencies: [] },
    { code: "S15", name: "Meghalaya", constituencies: [] },
    { code: "S16", name: "Mizoram", constituencies: [] },
    { code: "S17", name: "Nagaland", constituencies: [] },
    { code: "U05", name: "NCT OF Delhi", constituencies: [] },
    { code: "S18", name: "Odisha", constituencies: [] },
    { code: "U07", name: "Puducherry", constituencies: [] },
    { code: "S19", name: "Punjab", constituencies: [] },
    { code: "S20", name: "Rajasthan", constituencies: [] },
    { code: "S21", name: "Sikkim", constituencies: [] },
    { code: "S22", name: "Tamil Nadu", constituencies: [] },
    { code: "S29", name: "Telangana", constituencies: [] },
    { code: "S23", name: "Tripura", constituencies: [] },
    { code: "S24", name: "Uttar Pradesh", constituencies: [] },
    { code: "S28", name: "Uttarakhand", constituencies: [] },
    { code: "S25", name: "West Bengal", constituencies: [] },
  ];
  for (let index = 0; index < STATE_CODES.length; index++) {
    const state = STATE_CODES[index];
    console.log("COLLECTING STATE: ", state.name);
    const pageHTML = await fetchHTML(
      `https://results.eci.gov.in/PcResultGenJune2024/partywiseresult-${state.code}.htm`
    );
    const dom = new JSDOM(pageHTML);
    const data = dom.window.document.querySelector(
      "#ctl00_ContentPlaceHolder1_Result1_ddlState"
    );
    Array.from(data.options).forEach((option) => {
      state.constituencies.push({
        code: option.value,
        name: option.innerHTML,
      });
    });
  }

  fs.writeFileSync("output.json", JSON.stringify(STATE_CODES));
};

const getIndiaData = async () => {
  for (let index = 0; index < STATES.length; index++) {
    const state = STATES[index];
    for (let j = 0; j < state.constituencies.length; j++) {
      const constituency = state.constituencies[j];
      console.log("COLLECTING constituency: ", constituency.name);
      const pageHTML = await fetchHTML(
        `https://results.eci.gov.in/PcResultGenJune2024/candidateswise-${constituency.code}.htm`
      );
      const dom = new JSDOM(pageHTML);
      const candidates = Array.from(
        dom.window.document.querySelectorAll(".cand-box")
      );
      for (let k = 0; k < candidates.length; k++) {
        const candidate = candidates[k];
        const statsText = candidate.childNodes[3].childNodes[1].textContent
          .trim()
          .replace(/\s+/g, " ");
        const statsArr = statsText.split(" ");
        const status = statsArr.splice(0, 1)[0];
        const currentCount = +statsArr.splice(0, 1)[0];
        const offset = +statsArr.join("").replace("(", "").replace(")", "");
        const candidateName =
          candidate.childNodes[3].childNodes[3].childNodes[1].innerHTML;
        const candidatePartyName =
          candidate.childNodes[3].childNodes[3].childNodes[3].innerHTML;
        if (candidateName === "NOTA") {
          constituency.candidates.push({
            name: candidateName,
            status: null,
            gap: 0,
            voteCount: +status,
            party: candidatePartyName,
          });
        } else {
          constituency.candidates.push({
            name: candidateName,
            status: status,
            gap: offset,
            voteCount: currentCount,
            party: candidatePartyName,
          });
        }
      }
    }
    fs.writeFileSync(
      `./election-result/${state.name}.json`,
      JSON.stringify(state)
    );
  }
};

const getStateData = async (stateName) => {
  const stateFound = STATES.find((state) =>
    state.name.toLowerCase().includes(stateName.toLowerCase())
  );
  if (!stateFound) {
    console.error(`State ${stateName} not found!`);
    return;
  }
  const state = stateFound;
  for (let j = 0; j < state.constituencies.length; j++) {
    const constituency = state.constituencies[j];
    console.log("COLLECTING constituency: ", constituency.name);
    const pageHTML = await fetchHTML(
      `https://results.eci.gov.in/PcResultGenJune2024/candidateswise-${constituency.code}.htm`
    );
    const dom = new JSDOM(pageHTML);
    const candidates = Array.from(
      dom.window.document.querySelectorAll(".cand-box")
    );
    for (let k = 0; k < candidates.length; k++) {
      const candidate = candidates[k];
      const statsText = candidate.childNodes[3].childNodes[1].textContent
        .trim()
        .replace(/\s+/g, " ");
      const statsArr = statsText.split(" ");
      const status = statsArr.splice(0, 1)[0];
      const currentCount = +statsArr.splice(0, 1)[0];
      const offset = +statsArr.join("").replace("(", "").replace(")", "");
      const candidateName =
        candidate.childNodes[3].childNodes[3].childNodes[1].innerHTML;
      const candidatePartyName =
        candidate.childNodes[3].childNodes[3].childNodes[3].innerHTML;
      if (candidateName === "NOTA") {
        constituency.candidates.push({
          name: candidateName,
          status: null,
          gap: 0,
          voteCount: +status,
          party: candidatePartyName,
        });
      } else {
        constituency.candidates.push({
          name: candidateName,
          status: status,
          gap: offset,
          voteCount: currentCount,
          party: candidatePartyName,
        });
      }
    }
  }
  fs.writeFileSync(
    `./election-result/${state.name}.json`,
    JSON.stringify(state)
  );
};

const getConstituencyData = async (constituencyName) => {
  let constituencyFound = null;
  STATES.forEach((state) => {
    const found = state.constituencies.find((c) =>
      c.name.toLowerCase().includes(constituencyName)
    );
    if (found) {
      constituencyFound = found;
    }
  });

  if (!constituencyFound) {
    console.error(`Constituency ${constituencyFound} not found!`);
    return;
  }

  const constituency = constituencyFound;
  console.log("COLLECTING constituency: ", constituency.name);
  const pageHTML = await fetchHTML(
    `https://results.eci.gov.in/PcResultGenJune2024/candidateswise-${constituency.code}.htm`
  );
  const dom = new JSDOM(pageHTML);
  const candidates = Array.from(
    dom.window.document.querySelectorAll(".cand-box")
  );
  for (let k = 0; k < candidates.length; k++) {
    const candidate = candidates[k];
    const statsText = candidate.childNodes[3].childNodes[1].textContent
      .trim()
      .replace(/\s+/g, " ");
    const statsArr = statsText.split(" ");
    const status = statsArr.splice(0, 1)[0];
    const currentCount = +statsArr.splice(0, 1)[0];
    const offset = +statsArr.join("").replace("(", "").replace(")", "");
    const candidateName =
      candidate.childNodes[3].childNodes[3].childNodes[1].innerHTML;
    const candidatePartyName =
      candidate.childNodes[3].childNodes[3].childNodes[3].innerHTML;
    if (candidateName === "NOTA") {
      constituency.candidates.push({
        name: candidateName,
        status: null,
        gap: 0,
        voteCount: +status,
        party: candidatePartyName,
      });
    } else {
      constituency.candidates.push({
        name: candidateName,
        status: status,
        gap: offset,
        voteCount: currentCount,
        party: candidatePartyName,
      });
    }
  }
  fs.writeFileSync(
    `./constituency-result/${constituency.name}.json`,
    JSON.stringify(constituency)
  );
};

(async () => {
  const argv = argumentReader(process.argv.slice(2));
  if (argv.state) {
    await getStateData(argv.state);
  } else if (argv.constituency) {
    await getConstituencyData(argv.constituency);
  } else {
    await getIndiaData();
  }
})();
