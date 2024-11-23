chrome.action.onClicked.addListener(async (tab) => {
  const lesson = await retrieveLessonData(tab);
  const transscript = await buildTranscript(lesson);
  const transcriptUrl = `data:text/plain;charset=UTF-8,${transscript}`;
  const fileName= lesson.title.replace(/([^a-z0-9\s]+)/gi, '')
   await chrome.downloads.download({
      url: transcriptUrl,
      filename: `${fileName}.txt`,
    });
    await chrome.downloads.download({
      url: lesson.audio_url,
      filename: `${fileName}.mp3`,
    });

  
});

/**
 * @param {lesson} lesson
 * @returns {Promise<string>} transcriptionFile
 */
async function buildTranscript(lesson) {
  /**
   * @type crd
   */
  const crd = await (await fetch(lesson.crd_url)).json();
  const text = crd.words.map((w) => w.hanzi).join("");
  return text;
}

/**
 * @param {chrome.tabs.Tab} tab
 * @returns {Promise<lesson>}
 */
async function retrieveLessonData(tab) {
  const { id, title, type, chapter } = getLessonIdentifier(tab);
  const url = `https://duchinese.net/lessons.json?levels=newbie,elementary,intermediate,upper%20intermediate,master,advanced&q=${encodeURIComponent(
    title
  )}`;
  /**
   * @type {searchResult}
   */
  const searchResult = await (
    await fetch(url, {
      headers: {
        accept: "application/json",
      },
      method: "GET",
    })
  ).json();
  /**
   * @type {lesson | undefined}
   */
  let lesson;
  switch (type) {
    case "courses":
      lesson = searchResult.lessons.find(
        (l) =>
          l.course?.id.toString() === id &&
          chapter !== null &&
          l.course_position === chapter - 1
      );
      break;
    case "lessons":
      lesson = searchResult.lessons.find((l) => l.id === id);

      break;
    default:
      throw new Error("Unknown lesson Type");
  }
  if (!lesson) {
    console.error("Unable to find lesson. SearchResult was: ", searchResult);
    throw new Error("Unable to find lesson.");
  }
  return lesson;
}

/**
 * @typedef {"courses" | "lessons"} lessonType
 */

/**
 * @typedef {curseBasedLesson | standaloneLesson} lesson
 */

/**
 * @param {chrome.tabs.Tab} tab
 * @returns {{title: string, id: string, type: lessonType, chapter: number | null}}
 */
function getLessonIdentifier(tab) {
  if (!tab.url) {
    throw new Error("Manifest missing 'Tabs' permission");
  }
  const url = new URL(tab.url);
  const splitPath = url.pathname.split("/");
  /**
   * @type {string[] | undefined}
   */
  const lessonWithId = splitPath.at(-1)?.split("-");
  if (!lessonWithId) {
    throw new Error("Path malformed. Unable to get lessonWithId");
  }
  const id = lessonWithId.at(0);
  if (!id) {
    throw new Error("Path malformed. Unable to get ID.");
  }
  const type = splitPath.at(-2);
  if (!type || (type !== "courses" && type !== "lessons")) {
    throw new Error("Path malformed. Unable to get type.");
  }

  const chapter = url.searchParams.get("chapter");
  if (type === "courses" && !chapter) {
    throw new Error("Path malformed. Unable to get chapter for course.");
  }

  return {
    title: lessonWithId.slice(1).join(" "),
    id,
    type,
    chapter: chapter !== null ? Number.parseInt(chapter) : null,
  };
}

/**
 * @typedef {object} searchResult
 * @property {lesson[]} lessons
 * @property {?} next_page_url
 */

/**
 * @typedef {object} curseBasedLesson
 * @property {string} id
 * @property {string} title
 * @property {string} level
 * @property {string} synopsis
 * @property {?} author
 * @property {boolean} free
 * @property {string} large_image_url
 * @property {string} medium_image_url
 * @property {string} thumb_image_url
 * @property {string} release_at_formatted
 * @property {string} canonical_url
 * @property {string} path
 * @property {boolean} locked
 * @property {string} crd_url
 * @property {string} audio_url
 * @property {string} release_at
 * @property {string} updated_at
 * @property {boolean} has_course
 * @property {string} course_title
 * @property {string} course_group
 * @property {string} course_path
 * @property {string} course_type
 * @property {number} course_position
 * @property {course} course
 */

/**
 * @typedef {object} standaloneLesson
 * @property {string} id
 * @property {string} title
 * @property {string} level
 * @property {string} synopsis
 * @property {null} author
 * @property {boolean} free
 * @property {string} large_image_url
 * @property {string} medium_image_url
 * @property {string} thumb_image_url
 * @property {string} release_at_formatted
 * @property {string} canonical_url
 * @property {string} path
 * @property {boolean} locked
 * @property {string} crd_url
 * @property {string} audio_url
 * @property {string} release_at
 * @property {string} updated_at
 * @property {boolean} has_course
 * @property {null} course_title
 * @property {null} course_group
 * @property {null} course_path
 * @property {null} course_type
 * @property {null} course_position
 * @property {null} course
 */

/**
 * @typedef {object} course
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} group
 * @property {string} path
 * @property {string[]} levels
 * @property {string} medium_image_url
 * @property {string} large_image_url
 * @property {number} lesson_count
 * @property {string} lessons_url
 * @property {string} lessons_canonical_path
 * @property {string} type
 * @property {number} placeholder_count
 * @property {boolean} is_new
 * @property {?} document_ids
 * @property {string} release_at
 */

/**
 * @typedef {object} crd
 * @property {object[]} words
 * @property {string} words.d
 * @property {string} words.g
 * @property {boolean} words.gh
 * @property {number} words.hsk
 * @property {string} words.hanzi
 * @property {string} words.pinyin
 * @property {string} words.meaning
 * @property {string} words.tc_hanzi
 * @property {number} version
 * @property {number[]} syllable_times
 * @property {number[]} sentence_indices
 * @property {string[]} sentence_translations
 */
