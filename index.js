import { Client } from "@notionhq/client"
import 'dotenv/config'

const notion = new Client({ auth: process.env.NOTION_KEY })

const databaseId = process.env.NOTION_DATABASE_ID

async function getTasksFromNotionDatabase() {
  const pages = []
  let cursor = undefined

  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    })
    pages.push(...results)
    if (!next_cursor) {
      break
    }
    cursor = next_cursor
  }
  console.log(`${pages.length} pages successfully fetched.`)

  const tasks = []
  for (const page of pages) {
    const pageId = page.id

    const statusPropertyId = page.properties["Goal Type"].id
    const statusPropertyItem = await getPropertyValue({
      pageId,
      propertyId: statusPropertyId,
    })
    const status = statusPropertyItem.select
      ? statusPropertyItem.select.name
      : "No Status"

    const titlePropertyId = page.properties["Name"].id
    const titlePropertyItems = await getPropertyValue({
      pageId,
      propertyId: titlePropertyId,
    })
    const title = titlePropertyItems
      .map(propertyItem => propertyItem.title.plain_text)
      .join("")

    tasks.push({ pageId, status, title })
  }

  return tasks
}


async function getPropertyValue({ pageId, propertyId }) {
  const propertyItem = await notion.pages.properties.retrieve({
    page_id: pageId,
    property_id: propertyId,
  })
  if (propertyItem.object === "property_item") {
    return propertyItem
  }

  // Property is paginated.
  let nextCursor = propertyItem.next_cursor
  const results = propertyItem.results

  while (nextCursor !== null) {
    const propertyItem = await notion.pages.properties.retrieve({
      page_id: pageId,
      property_id: propertyId,
      start_cursor: nextCursor,
    })

    nextCursor = propertyItem.next_cursor
    results.push(...propertyItem.results)
  }

  return results
}


getTasksFromNotionDatabase().then((e)=> {console.log(e);})

