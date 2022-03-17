import { MbBook, MbBookNote, MbTopic, MNPic } from "typings"
import { postNotification } from "./common"
import { MN } from "const"
import { unique } from "utils"

/**
 * 获取选中的卡片
 */
const getSelectNodes = (): MbBookNote[] => {
  const MindMapNodes: any[] | undefined =
    MN.studyController().notebookController.mindmapView.selViewLst
  return MindMapNodes?.length ? MindMapNodes.map(item => item.note.note) : []
}

/**
 * 获取整个卡片树，传入 node 必须含有子节点
 */
const getNodeTree = (node: MbBookNote) => {
  const DFS = (
    nodes: MbBookNote[],
    level = 0,
    lastIndex = [] as number[],
    res = {
      children: [] as MbBookNote[],
      treeIndex: [] as number[][]
    }
  ) => {
    level++
    nodes.forEach((node, index) => {
      res.children.push(node)
      lastIndex = lastIndex.slice(0, level - 1)
      lastIndex.push(index)
      res.treeIndex.push(lastIndex)
      node.childNotes?.length && DFS(node.childNotes, level, lastIndex, res)
    })
    return res
  }
  const { children, treeIndex } = DFS(node.childNotes!)
  return {
    // 只有子节点
    onlyChildren: children,
    // 只有第一层的子节点
    onlyFirstLevel: node.childNotes!,
    // 选中的卡片及其子节点
    allNodes: [node, ...children],
    treeIndex
  }
}

/**
 * 获取卡片中的所有摘录节点
 */
const getExcerptNotes = (node: MbBookNote): MbBookNote[] => {
  return node.comments.reduce(
    (acc, cur) => {
      cur.type == "LinkNote" && acc.push(MN.db.getNoteById(cur.noteid)!)
      return acc
    },
    [node]
  )
}

const exportPic = (pic: MNPic) => {
  const base64 = MN.db.getMediaByHash(pic.paint)!.base64Encoding()
  return {
    base64,
    html: `<img src="data:image/jpeg;base64,${base64}"/>`,
    md: `![](data:image/jpeg;base64,${base64})`
  }
}

/**
 * 获取卡片中的所有摘录文字
 * @param node 卡片节点
 * @param highlight 默认有重点
 * @param pic 默认为 OCR 后的文字
 */
const getExcerptText = (
  node: MbBookNote,
  highlight = true,
  picType: "ocr" | "base64" | "html" | "md" = "ocr"
): string[] => {
  let mainExcerpt = node.excerptText ?? ""
  if (node.excerptPic && picType !== "ocr") {
    mainExcerpt = exportPic(node.excerptPic)[picType]
  }
  const excerpts = node.comments.reduce(
    (acc, cur) => {
      if (cur.type == "LinkNote") {
        let text = cur.q_htext ?? ""
        if ("q_hpic" in cur && picType != "ocr") {
          text = exportPic(cur.q_hpic)[picType]
        }
        text && acc.push(text)
      }
      return acc
    },
    mainExcerpt ? [mainExcerpt] : []
  )
  return highlight ? excerpts : excerpts.map(k => removeHighlight(k))
}

const getNoteById = (noteid: string): MbBookNote => MN.db.getNoteById(noteid)!

// topic 就是 notebook
const getNotebookById = (notebookid: string): MbTopic =>
  MN.db.getNotebookById(notebookid)!

const getDocumentById = (docMd5: string): MbBook =>
  MN.db.getDocumentById(docMd5)!

/**
 * 可撤销的动作，所有修改数据的动作都应该用这个方法包裹
 */
const undoGrouping = (f: () => void) => {
  UndoManager.sharedInstance().undoGrouping("", self.notebookid, f)
}

const undoGroupingWithRefresh = (f: () => void) => {
  undoGrouping(f)
  RefreshAfterDBChange()
}

/**
 * 保存数据，刷新界面
 */
const RefreshAfterDBChange = () => {
  MN.db.setNotebookSyncDirty(self.notebookid)
  postNotification("RefreshAfterDBChange", {
    topicid: self.notebookid
  })
}

/**
 * 获取评论的索引
 */
const getCommentIndex = (note: MbBookNote, comment: MbBookNote | string) => {
  const comments = note.comments
  for (let i = 0; i < comments.length; i++) {
    const _comment = comments[i]
    if (typeof comment == "string") {
      if (_comment.type == "TextNote" && _comment.text == comment) return i
    } else if (_comment.type == "LinkNote" && _comment.noteid == comment.noteId)
      return i
  }
  return -1
}

/**
 * 获取卡片内所有的文字
 * @param note
 * @param separator 分隔符号
 * @param highlight 是否保留划重点
 * @returns
 */

const getAllText = (node: MbBookNote, separator = "\n", highlight = true) => {
  return [
    ...getExcerptText(node, highlight, "ocr"),
    ...getAllCommnets(node, "none"),
    getAllTags(node).join(" ")
  ].join(separator)
}

const removeHighlight = (text: string) => text.replace(/\*\*/g, "")

const getAllTags = (node: MbBookNote, hash = true) => {
  const tags = node.comments.reduce((acc, cur) => {
    if (cur.type == "TextNote" || cur.type == "HtmlNote") {
      acc.push(...cur.text.split(/\s/).filter(k => k.startsWith("#")))
    }
    return acc
  }, [] as string[])
  return hash ? tags : tags.map(k => k.slice(1))
}

const getAllCommnets = (
  node: MbBookNote,
  picType: "none" | "base64" | "html" | "md" = "none"
) => {
  return node.comments.reduce((acc, cur) => {
    if (cur.type === "PaintNote" && picType !== "none") {
      acc.push(exportPic(cur)[picType])
    } else if (cur.type == "TextNote" || cur.type == "HtmlNote") {
      const text = cur.text.trim()
      text &&
        !text.includes("marginnote3app") &&
        !text.startsWith("#") &&
        acc.push(text)
    }
    return acc
  }, [] as string[])
}

/**
 * 添加标签，并且会去除划重点
 * @param force 强制整理合并标签，就算没有添加标签
 */
const addTags = (node: MbBookNote, tags: string[], force = false) => {
  const existingTags: string[] = []
  const tagCommentIndex: number[] = []
  node.comments.forEach((comment, index) => {
    if (comment.type == "TextNote") {
      const _tags = comment.text.split(" ")
      if (_tags.every(tag => tag.startsWith("#"))) {
        existingTags.push(..._tags.map(tag => tag.slice(1)))
        tagCommentIndex.push(index)
      }
    }
  })

  // 如果该标签已存在，而且不是强制，就退出
  if (!force && (!tags.length || tags.every(tag => existingTags.includes(tag))))
    return

  // 从后往前删，索引不会变
  tagCommentIndex
    .reverse()
    .forEach(index => void node.removeCommentByIndex(index))

  const tagLine = unique([...existingTags, ...tags])
    .map(tag => `#${tag}`)
    .join(" ")

  tagLine && node.appendTextComment(removeHighlight(tagLine))
}

export {
  getSelectNodes,
  getNodeTree,
  getExcerptNotes,
  getExcerptText,
  getCommentIndex,
  getNotebookById,
  getNoteById,
  getAllText,
  undoGrouping,
  undoGroupingWithRefresh,
  RefreshAfterDBChange,
  addTags,
  getAllTags,
  getAllCommnets,
  removeHighlight,
  getDocumentById
}
