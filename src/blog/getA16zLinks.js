import { algoliasearch } from "algoliasearch"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outputFilePath = path.join(__dirname, "a16zBlogList.txt")

// Init values here might change - always check for changes
const algoliaSearchKey = "be4c2008dbb90c57dc09a716a759777d"
const algoliaSearchAppID = "WSGRH40UZZ"
const indexName = "a16z_posts_prod"

const searchQuery = "Marc Andreessen"

const client = algoliasearch(algoliaSearchAppID, algoliaSearchKey)

const fetchResults = async () => {
	try {
		const response = await client.searchSingleIndex({
			indexName: indexName,
			searchParams: {
				query: searchQuery,
				facetFilters: ["is_hidden:false", ["type:Article"]], // Only fetching article for now (will deal with podcasts later)
				page: 0,
				hitsPerPage: 1000, // 1000 hits is the max
			},
		})
		// For the foreseeable future, probably best to rework this function to fetch more than 1000 hits
		// But for now, I don't expect it get to 1000 yet. At least, not for a few months...

		return response
	} catch (error) {
		console.error("Error fetching search results:", error)
	}
}

const filterResults = async (results) => {
	const filterTexts = ["podcast", "a16zcrypto.com", "tweetstorm"] // Will handle podcasts and other sources differently

	return results.filter((result) => {
		const searchFields = [result.title, result.url, result.type]

		return !searchFields.some((field) => filterTexts.some((text) => field?.toLowerCase().includes(text.toLowerCase())))
	})
}

async function appendToTxtFile(url) {
	await fs.appendFile(outputFilePath, url, "utf8")
}

;(async () => {
	const results = await fetchResults()
	const filteredResults = await filterResults(results.hits)

	// console.log("Search Results:", results.hits)
	// console.log("Total Pages:", results.nbPages)
	console.log("Total Results:", results.nbHits)

	// Clear existing file if it exists
	try {
		await fs.unlink(outputFilePath)
	} catch (error) {
		// Ignore error if file does not exist
	}

	for (let i = 0; i < filteredResults.length; i++) {
		const result = filteredResults[i]
		// Check if it's the last entry
		const url =
			i === filteredResults.length - 1
				? `https://a16z.com${result.url}` // No newline for the last entry
				: `https://a16z.com${result.url}\n`
		await appendToTxtFile(url)
	}

	console.log(`Successfully saved ${filteredResults.length} urls!`)
})()
