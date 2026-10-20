/** Canonical visual language, adopted from the Crown base. Brand accents are profiles. */
export const WORLD_STYLE=Object.freeze({
  "schema": 1,
  "core": {
    "paper": "#F2F1F0",
    "ink": "#1E1E1E",
    "shell": "#D9D9D6",
    "support": "#454447",
    "edge": "#78797B",
    "rubber": "#222222",
    "line": "#BEC1C5",
    "accent": "#607D89"
  },
  "worker": {
    "vest": "#607D89",
    "vestEdge": "#48616D",
    "shirt": "#454447",
    "pants": "#454447",
    "seam": "#323232",
    "boot": "#30383C",
    "sole": "#1E282D",
    "skin": "#B89173",
    "reflective": "#E4E8D9",
    "helmet": "#F1EFE4",
    "glove": "#666E68",
    "glass": "#263C45",
    "metal": "#778A90"
  },
  "trees": {
    "trunk": "#766B55",
    "foliage": [
      "#39744B",
      "#52834A",
      "#6B9952",
      "#2E6143"
    ]
  },
  "materials": {
    "product": {
      "roughness": 0.65,
      "metalness": 0.12
    },
    "worker": {
      "roughness": 0.86,
      "metalness": 0
    },
    "glass": {
      "roughness": 0.32,
      "opacity": 1,
      "transparent": false
    },
    "environment": {
      "roughness": 0.82,
      "metalness": 0
    }
  },
  "conventions": {
    "unit": "metre",
    "webUp": "+Y",
    "webForward": "-Z",
    "blenderUp": "+Z",
    "blenderForward": "+Y",
    "ground": 0,
    "workerHeightApproxM": 1.75
  }
});
