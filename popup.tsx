import "./ui/popup.css"

import { createChromeStorage } from "./storage"
import { Popup } from "./ui/Popup"

const storage = createChromeStorage()

function IndexPopup() {
  return <Popup rules={storage.rules} settings={storage.settings} />
}

export default IndexPopup
