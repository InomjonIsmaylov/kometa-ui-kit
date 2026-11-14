package uz.kometa.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue

/** How many pages [total] rows make at [size] a page; never fewer than one. */
internal fun pageCountOf(total: Int, size: Int): Int = maxOf(1, (maxOf(0, total) + maxOf(1, size) - 1) / maxOf(1, size))

/** The page shown: back to 1 when what the page was set under ([was]) differs from [now], else [page] kept inside 1..[count]. */
internal fun pageNow(page: Int, was: Any?, now: Any?, count: Int): Int = if (was != now) 1 else page.coerceIn(1, count)

/** Page [page] (1-based) of [rows] at [size] a page. */
internal fun <T> pageSlice(rows: List<T>, page: Int, size: Int): List<T> {
    val s = maxOf(1, size)
    val from = ((page - 1) * s).coerceIn(0, rows.size)
    return rows.subList(from, minOf(rows.size, from + s))
}

/**
 * Text in reading order with digits by value ("a2" before "a10"), ignoring case; null sorts as "".
 * Use it in [KometaListView] sorts: `"name" to Comparator { a, b -> kometaSortText(a.name, b.name) }`.
 * Numbers and dates need no helper: `compareBy { it.at }` (Kotlin puts null first, as the web does).
 */
// shortcut: compares lowercased code points, not a locale collator (Cyrillic and Latin order hold; accents and Ё do not); upgrade with a platform Collator if a list sorts accented names.
fun kometaSortText(a: String?, b: String?): Int {
    val x = (a ?: "").lowercase()
    val y = (b ?: "").lowercase()
    var i = 0
    var j = 0
    while (i < x.length && j < y.length) {
        if (x[i].isDigit() && y[j].isDigit()) {
            val si = i; while (i < x.length && x[i].isDigit()) i++
            val sj = j; while (j < y.length && y[j].isDigit()) j++
            val p = x.substring(si, i).trimStart('0')
            val q = y.substring(sj, j).trimStart('0')
            if (p.length != q.length) return p.length - q.length
            val n = p.compareTo(q)
            if (n != 0) return n
        } else {
            if (x[i] != y[j]) return x[i].compareTo(y[j])
            i++; j++
        }
    }
    return (x.length - i) - (y.length - j)
}

/**
 * Client-side paging for a list the API returns whole (the web's `listView`): filter, sort, slice.
 * Set [source] (and [filter]) as they change; read [rows] for the visible slice, [total] for the
 * filtered count the pager pages over and [all] for the unfiltered one ("nothing yet" versus "nothing
 * matches"). A changed [filterKey], sort, direction or page size sends [page] back to 1; a shorter
 * list keeps it inside [pageCount]. [pickSort] flips the direction on the active key, else switches
 * to the key in its `dirs` direction (ascending unless named). A key missing from `sorts` keeps the
 * source order; the sort is stable, so equal rows keep it too. For a list the server pages, skip
 * this and hold page and page size yourself. In a composable, [rememberKometaListView] builds one.
 */
@Stable
class KometaListView<T>(
    private val sorts: Map<String, Comparator<in T>>,
    sort: String,
    pageSize: Int,
    private val dirs: Map<String, KometaSortDir> = emptyMap(),
) {
    var source: List<T> by mutableStateOf(emptyList())
    var filter: ((T) -> Boolean)? by mutableStateOf(null)
    /** Change it with the filter (the query text, say): a lambda has no useful equality, so this tells a new filter from a rebuilt one. */
    var filterKey: Any? by mutableStateOf(null)
    var sort: String by mutableStateOf(sort)
    var dir: KometaSortDir by mutableStateOf(dirs[sort] ?: KometaSortDir.Asc)
    var pageSize: Int by mutableIntStateOf(pageSize)

    private var setPage by mutableIntStateOf(1)
    private var setUnder: Any? by mutableStateOf(under())
    private fun under(): Any = listOf(filterKey, sort, dir, pageSize)

    private val ordered by derivedStateOf {
        val kept = filter?.let { source.filter(it) } ?: source
        val cmp = sorts[sort] ?: return@derivedStateOf kept
        if (dir == KometaSortDir.Desc) kept.sortedWith { a, b -> cmp.compare(b, a) } else kept.sortedWith(cmp)
    }

    val total: Int get() = ordered.size
    val all: Int get() = source.size
    val pageCount: Int get() = pageCountOf(total, pageSize)

    // shortcut: a list that shrinks and grows back returns to the page set before (the web keeps the clamped page); store the clamp if that matters.
    var page: Int
        get() = pageNow(setPage, setUnder, under(), pageCount)
        set(v) { setPage = v; setUnder = under() }

    val rows: List<T> get() = pageSlice(ordered, page, pageSize)

    fun pickSort(key: String) {
        dir = nextSortDir(key, sort, dir, dirs[key] ?: KometaSortDir.Asc)
        sort = key
    }
}

/**
 * A [KometaListView] kept across recompositions, fed [source], [filter] and [filterKey] on every
 * one. [filter] is taken anew only when [filterKey] changes, so key it on what the filter reads
 * (the query text). [sort], [pageSize] and [dirs] are only the starting values.
 */
@Composable
fun <T> rememberKometaListView(
    source: List<T>,
    sorts: Map<String, Comparator<in T>>,
    sort: String,
    pageSize: Int,
    dirs: Map<String, KometaSortDir> = emptyMap(),
    filterKey: Any? = null,
    filter: ((T) -> Boolean)? = null,
): KometaListView<T> = remember { KometaListView(sorts, sort, pageSize, dirs) }.also {
    it.source = source
    // The lambda is rebuilt on every recomposition; taking it only when the key moves spares a re-sort each time.
    it.filter = remember(filterKey, filter == null) { filter }
    it.filterKey = filterKey
}
