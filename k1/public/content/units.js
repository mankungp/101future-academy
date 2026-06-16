window.K1_UNITS = {
  "animals": {
    "id": "animals",
    "order": 6,
    "title": "Animals",
    "theme": "nature",
    "intro": {
      "audio": "audio/phrases/intro-animals.mp3",
      "text": "Let's meet the animals!"
    },
    "words": [
      {
        "id": "dog",
        "text": "dog",
        "image": "img/animals/dog.png",
        "audio": "audio/words/dog.mp3",
        "sound": "audio/sounds/dog.mp3"
      },
      {
        "id": "cat",
        "text": "cat",
        "image": "img/animals/cat.png",
        "audio": "audio/words/cat.mp3",
        "sound": "audio/sounds/cat.mp3"
      },
      {
        "id": "cow",
        "text": "cow",
        "image": "img/animals/cow.png",
        "audio": "audio/words/cow.mp3",
        "sound": "audio/sounds/cow.mp3"
      },
      {
        "id": "pig",
        "text": "pig",
        "image": "img/animals/pig.png",
        "audio": "audio/words/pig.mp3",
        "sound": "audio/sounds/pig.mp3"
      },
      {
        "id": "duck",
        "text": "duck",
        "image": "img/animals/duck.png",
        "audio": "audio/words/duck.mp3",
        "sound": "audio/sounds/duck.mp3"
      },
      {
        "id": "lion",
        "text": "lion",
        "image": "img/animals/lion.png",
        "audio": "audio/words/lion.mp3",
        "sound": "audio/sounds/lion.mp3"
      },
      {
        "id": "elephant",
        "text": "elephant",
        "image": "img/animals/elephant.png",
        "audio": "audio/words/elephant.mp3",
        "sound": "audio/sounds/elephant.mp3"
      },
      {
        "id": "monkey",
        "text": "monkey",
        "image": "img/animals/monkey.png",
        "audio": "audio/words/monkey.mp3",
        "sound": "audio/sounds/monkey.mp3"
      },
      {
        "id": "frog",
        "text": "frog",
        "image": "img/animals/frog.png",
        "audio": "audio/words/frog.mp3",
        "sound": "audio/sounds/frog.mp3"
      },
      {
        "id": "fish",
        "text": "fish",
        "image": "img/animals/fish.png",
        "audio": "audio/words/fish.mp3",
        "sound": "audio/sounds/fish.mp3"
      },
      {
        "id": "bird",
        "text": "bird",
        "image": "img/animals/bird.png",
        "audio": "audio/words/bird.mp3",
        "sound": "audio/sounds/bird.mp3"
      },
      {
        "id": "bear",
        "text": "bear",
        "image": "img/animals/bear.png",
        "audio": "audio/words/bear.mp3",
        "sound": "audio/sounds/bear.mp3"
      }
    ],
    "missions": [
      {
        "id": "animals-explore",
        "type": "free-explore",
        "items": [
          "dog",
          "cat",
          "cow",
          "pig",
          "duck",
          "lion",
          "elephant",
          "monkey",
          "frog",
          "fish",
          "bird",
          "bear"
        ],
        "prompt": {
          "text": "Pop the balloons!",
          "audioPattern": "audio/words/{id}.mp3"
        },
        "config": {
          "render": "balloon"
        }
      },
      {
        "id": "animals-tap",
        "type": "listen-and-tap",
        "items": [
          "dog",
          "cat",
          "cow",
          "pig",
          "duck",
          "lion",
          "elephant",
          "monkey",
          "frog",
          "fish",
          "bird",
          "bear"
        ],
        "rounds": 12,
        "prompt": {
          "text": "Tap the {word}!",
          "audioPattern": "audio/phrases/tap-{id}.mp3"
        },
        "config": {
          "choices": 4
        }
      }
    ],
    "reward": {
      "audio": "audio/praise/great-job.mp3"
    }
  },
  "colors": {
    "id": "colors",
    "order": 9,
    "title": "Colors",
    "theme": "things-around",
    "intro": {
      "audio": "audio/phrases/intro-colors.mp3",
      "text": "Let's learn colors!"
    },
    "words": [
      {
        "id": "red",
        "text": "red",
        "image": "img/red.png",
        "audio": "audio/words/red.mp3",
        "meta": {
          "hex": "#ff5b5b"
        }
      },
      {
        "id": "yellow",
        "text": "yellow",
        "image": "img/yellow.png",
        "audio": "audio/words/yellow.mp3",
        "meta": {
          "hex": "#ffd23f"
        }
      },
      {
        "id": "blue",
        "text": "blue",
        "image": "img/blue.png",
        "audio": "audio/words/blue.mp3",
        "meta": {
          "hex": "#4d8bff"
        }
      },
      {
        "id": "green",
        "text": "green",
        "image": "img/green.png",
        "audio": "audio/words/green.mp3",
        "meta": {
          "hex": "#5fd06a"
        }
      },
      {
        "id": "orange",
        "text": "orange",
        "image": "img/orange.png",
        "audio": "audio/words/orange.mp3",
        "meta": {
          "hex": "#ff9f40"
        }
      },
      {
        "id": "purple",
        "text": "purple",
        "image": "img/purple.png",
        "audio": "audio/words/purple.mp3",
        "meta": {
          "hex": "#9b6dff"
        }
      },
      {
        "id": "pink",
        "text": "pink",
        "image": "img/pink.png",
        "audio": "audio/words/pink.mp3",
        "meta": {
          "hex": "#ff7eb3"
        }
      },
      {
        "id": "black",
        "text": "black",
        "image": "img/black.png",
        "audio": "audio/words/black.mp3",
        "meta": {
          "hex": "#2b2b3a"
        }
      },
      {
        "id": "white",
        "text": "white",
        "image": "img/white.png",
        "audio": "audio/words/white.mp3",
        "meta": {
          "hex": "#ffffff"
        }
      },
      {
        "id": "brown",
        "text": "brown",
        "image": "img/brown.png",
        "audio": "audio/words/brown.mp3",
        "meta": {
          "hex": "#a9744f"
        }
      },
      {
        "id": "gray",
        "text": "gray",
        "image": "img/gray.png",
        "audio": "audio/words/gray.mp3",
        "meta": {
          "hex": "#9aa3b2"
        }
      },
      {
        "id": "turquoise",
        "text": "turquoise",
        "image": "img/turquoise.png",
        "audio": "audio/words/turquoise.mp3",
        "meta": {
          "hex": "#16c4c0"
        }
      }
    ],
    "missions": [
      {
        "id": "colors-explore",
        "type": "free-explore",
        "items": [
          "red",
          "yellow",
          "blue",
          "green"
        ],
        "prompt": {
          "text": "Tap a balloon!",
          "audioPattern": "audio/words/{id}.mp3"
        },
        "config": {
          "render": "balloon"
        }
      },
      {
        "id": "colors-tap",
        "type": "listen-and-tap",
        "items": [
          "red",
          "yellow",
          "blue",
          "green",
          "orange",
          "purple",
          "pink",
          "black",
          "white",
          "brown",
          "gray",
          "turquoise"
        ],
        "rounds": 12,
        "prompt": {
          "text": "Tap the {word} balloon!",
          "audioPattern": "audio/phrases/tap-{id}.mp3"
        },
        "config": {
          "choices": 4,
          "render": "balloon"
        }
      }
    ],
    "reward": {
      "sticker": "img/_sticker-rainbow.png",
      "audio": "audio/praise/great-job.mp3"
    }
  },
  "family": {
    "id": "family",
    "order": 4,
    "title": "Family",
    "theme": "people",
    "intro": {
      "audio": "audio/phrases/intro-family.mp3",
      "text": "Let's meet the family!"
    },
    "words": [
      {
        "id": "mom",
        "text": "mom",
        "image": "img/family/mom.png",
        "audio": "audio/words/mom.mp3"
      },
      {
        "id": "dad",
        "text": "dad",
        "image": "img/family/dad.png",
        "audio": "audio/words/dad.mp3"
      },
      {
        "id": "baby",
        "text": "baby",
        "image": "img/family/baby.png",
        "audio": "audio/words/baby.mp3"
      },
      {
        "id": "brother",
        "text": "brother",
        "image": "img/family/brother.png",
        "audio": "audio/words/brother.mp3"
      },
      {
        "id": "sister",
        "text": "sister",
        "image": "img/family/sister.png",
        "audio": "audio/words/sister.mp3"
      },
      {
        "id": "grandma",
        "text": "grandma",
        "image": "img/family/grandma.png",
        "audio": "audio/words/grandma.mp3"
      },
      {
        "id": "grandpa",
        "text": "grandpa",
        "image": "img/family/grandpa.png",
        "audio": "audio/words/grandpa.mp3"
      }
    ],
    "missions": [
      {
        "id": "family-explore",
        "type": "free-explore",
        "items": [
          "mom",
          "dad",
          "baby",
          "brother",
          "sister",
          "grandma",
          "grandpa"
        ],
        "prompt": {
          "text": "Pop the balloons!",
          "audioPattern": "audio/words/{id}.mp3"
        },
        "config": {
          "render": "balloon"
        }
      },
      {
        "id": "family-tap",
        "type": "listen-and-tap",
        "items": [
          "mom",
          "dad",
          "baby",
          "brother",
          "sister",
          "grandma",
          "grandpa"
        ],
        "rounds": 7,
        "prompt": {
          "text": "Tap {word}!",
          "audioPattern": "audio/phrases/tap-fam-{id}.mp3"
        },
        "config": {
          "choices": 4
        }
      }
    ],
    "reward": {
      "audio": "audio/praise/great-job.mp3"
    }
  },
  "fruits": {
    "id": "fruits",
    "order": 7,
    "title": "Fruits",
    "theme": "nature",
    "intro": {
      "audio": "audio/phrases/intro-fruits.mp3",
      "text": "Let's eat some fruits!"
    },
    "words": [
      {
        "id": "apple",
        "text": "apple",
        "image": "img/fruits/apple.png",
        "audio": "audio/words/apple.mp3"
      },
      {
        "id": "banana",
        "text": "banana",
        "image": "img/fruits/banana.png",
        "audio": "audio/words/banana.mp3"
      },
      {
        "id": "orange",
        "text": "orange",
        "image": "img/fruits/orange.png",
        "audio": "audio/words/orange.mp3"
      },
      {
        "id": "grape",
        "text": "grape",
        "image": "img/fruits/grape.png",
        "audio": "audio/words/grape.mp3"
      },
      {
        "id": "mango",
        "text": "mango",
        "image": "img/fruits/mango.png",
        "audio": "audio/words/mango.mp3"
      },
      {
        "id": "watermelon",
        "text": "watermelon",
        "image": "img/fruits/watermelon.png",
        "audio": "audio/words/watermelon.mp3"
      },
      {
        "id": "strawberry",
        "text": "strawberry",
        "image": "img/fruits/strawberry.png",
        "audio": "audio/words/strawberry.mp3"
      },
      {
        "id": "pineapple",
        "text": "pineapple",
        "image": "img/fruits/pineapple.png",
        "audio": "audio/words/pineapple.mp3"
      },
      {
        "id": "lemon",
        "text": "lemon",
        "image": "img/fruits/lemon.png",
        "audio": "audio/words/lemon.mp3"
      },
      {
        "id": "cherry",
        "text": "cherry",
        "image": "img/fruits/cherry.png",
        "audio": "audio/words/cherry.mp3"
      },
      {
        "id": "pear",
        "text": "pear",
        "image": "img/fruits/pear.png",
        "audio": "audio/words/pear.mp3"
      },
      {
        "id": "coconut",
        "text": "coconut",
        "image": "img/fruits/coconut.png",
        "audio": "audio/words/coconut.mp3"
      }
    ],
    "missions": [
      {
        "id": "fruits-explore",
        "type": "free-explore",
        "items": [
          "apple",
          "banana",
          "orange",
          "grape",
          "mango",
          "watermelon",
          "strawberry",
          "pineapple",
          "lemon",
          "cherry",
          "pear",
          "coconut"
        ],
        "prompt": {
          "text": "Pop the balloons!",
          "audioPattern": "audio/words/{id}.mp3"
        },
        "config": {
          "render": "balloon"
        }
      },
      {
        "id": "fruits-tap",
        "type": "listen-and-tap",
        "items": [
          "apple",
          "banana",
          "orange",
          "grape",
          "mango",
          "watermelon",
          "strawberry",
          "pineapple",
          "lemon",
          "cherry",
          "pear",
          "coconut"
        ],
        "rounds": 12,
        "prompt": {
          "text": "Tap the {word}!",
          "audioPattern": "audio/phrases/tap-fruit-{id}.mp3"
        },
        "config": {
          "choices": 4
        }
      }
    ],
    "reward": {
      "audio": "audio/praise/great-job.mp3"
    }
  },
  "numbers": {
    "id": "numbers",
    "order": 11,
    "title": "Numbers",
    "theme": "things-around",
    "intro": {
      "audio": "audio/phrases/intro-numbers.mp3",
      "text": "Let's count!"
    },
    "words": [
      {
        "id": "one",
        "text": "one",
        "label": "1",
        "audio": "audio/words/one.mp3",
        "meta": {
          "hex": "#ff5b5b"
        }
      },
      {
        "id": "two",
        "text": "two",
        "label": "2",
        "audio": "audio/words/two.mp3",
        "meta": {
          "hex": "#ff9f40"
        }
      },
      {
        "id": "three",
        "text": "three",
        "label": "3",
        "audio": "audio/words/three.mp3",
        "meta": {
          "hex": "#ffd23f"
        }
      },
      {
        "id": "four",
        "text": "four",
        "label": "4",
        "audio": "audio/words/four.mp3",
        "meta": {
          "hex": "#5fd06a"
        }
      },
      {
        "id": "five",
        "text": "five",
        "label": "5",
        "audio": "audio/words/five.mp3",
        "meta": {
          "hex": "#16c4c0"
        }
      },
      {
        "id": "six",
        "text": "six",
        "label": "6",
        "audio": "audio/words/six.mp3",
        "meta": {
          "hex": "#4d8bff"
        }
      },
      {
        "id": "seven",
        "text": "seven",
        "label": "7",
        "audio": "audio/words/seven.mp3",
        "meta": {
          "hex": "#9b6dff"
        }
      },
      {
        "id": "eight",
        "text": "eight",
        "label": "8",
        "audio": "audio/words/eight.mp3",
        "meta": {
          "hex": "#ff7eb3"
        }
      },
      {
        "id": "nine",
        "text": "nine",
        "label": "9",
        "audio": "audio/words/nine.mp3",
        "meta": {
          "hex": "#a9744f"
        }
      },
      {
        "id": "ten",
        "text": "ten",
        "label": "10",
        "audio": "audio/words/ten.mp3",
        "meta": {
          "hex": "#ff5fa2"
        }
      }
    ],
    "missions": [
      {
        "id": "numbers-explore",
        "type": "free-explore",
        "items": [
          "one",
          "two",
          "three",
          "four",
          "five",
          "six",
          "seven",
          "eight",
          "nine",
          "ten"
        ],
        "prompt": {
          "text": "Pop the balloons!",
          "audioPattern": "audio/words/{id}.mp3"
        },
        "config": {
          "render": "balloon"
        }
      },
      {
        "id": "numbers-count",
        "type": "count",
        "counts": [
          1,
          2,
          3,
          4,
          5
        ],
        "prompt": {
          "text": "How many?",
          "audio": "audio/praise/howmany.mp3"
        }
      },
      {
        "id": "numbers-tap",
        "type": "listen-and-tap",
        "items": [
          "one",
          "two",
          "three",
          "four",
          "five",
          "six",
          "seven",
          "eight",
          "nine",
          "ten"
        ],
        "rounds": 10,
        "prompt": {
          "text": "Tap the number {word}!",
          "audioPattern": "audio/phrases/tap-num-{id}.mp3"
        },
        "config": {
          "choices": 4
        }
      }
    ],
    "reward": {
      "audio": "audio/praise/great-job.mp3"
    }
  },
  "shapes": {
    "id": "shapes",
    "order": 10,
    "title": "Shapes",
    "theme": "things-around",
    "intro": {
      "audio": "audio/phrases/intro-shapes.mp3",
      "text": "Let's learn shapes!"
    },
    "words": [
      {
        "id": "circle",
        "text": "circle",
        "image": "img/shapes/circle.png",
        "audio": "audio/words/circle.mp3"
      },
      {
        "id": "square",
        "text": "square",
        "image": "img/shapes/square.png",
        "audio": "audio/words/square.mp3"
      },
      {
        "id": "triangle",
        "text": "triangle",
        "image": "img/shapes/triangle.png",
        "audio": "audio/words/triangle.mp3"
      },
      {
        "id": "star",
        "text": "star",
        "image": "img/shapes/star.png",
        "audio": "audio/words/star.mp3"
      },
      {
        "id": "heart",
        "text": "heart",
        "image": "img/shapes/heart.png",
        "audio": "audio/words/heart.mp3"
      },
      {
        "id": "rectangle",
        "text": "rectangle",
        "image": "img/shapes/rectangle.png",
        "audio": "audio/words/rectangle.mp3"
      }
    ],
    "missions": [
      {
        "id": "shapes-explore",
        "type": "free-explore",
        "items": [
          "circle",
          "square",
          "triangle",
          "star",
          "heart",
          "rectangle"
        ],
        "prompt": {
          "text": "Pop the balloons!",
          "audioPattern": "audio/words/{id}.mp3"
        },
        "config": {
          "render": "balloon"
        }
      },
      {
        "id": "shapes-tap",
        "type": "listen-and-tap",
        "items": [
          "circle",
          "square",
          "triangle",
          "star",
          "heart",
          "rectangle"
        ],
        "rounds": 6,
        "prompt": {
          "text": "Tap the {word}!",
          "audioPattern": "audio/phrases/tap-shape-{id}.mp3"
        },
        "config": {
          "choices": 4
        }
      }
    ],
    "reward": {
      "audio": "audio/praise/great-job.mp3"
    }
  }
};
