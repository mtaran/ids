/**
 * Gets the value associated with |key| from localStorage, or |defaultVal| if
 * it's not in localStorage.
 * @param  {string} key        
 * @param  {string} defaultVal 
 * @return {string}
 */
function readLocal(key, defaultVal) {
	if (localStorage.hasOwnProperty("ids/"+key)) {
		return localStorage['ids/'+key]
	}
	else
		return defaultVal
}

/**
 * Writes the key and value to localStorage.
 * @param  {string} key
 * @param  {string} val
 * @return {string}
 */
function writeLocal(key, val) {
	return localStorage["ids/"+key] = val
}