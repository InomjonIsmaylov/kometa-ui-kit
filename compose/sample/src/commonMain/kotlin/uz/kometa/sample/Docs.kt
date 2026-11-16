package uz.kometa.sample

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.kometa.ui.*

// The docs site's Kotlin tabs: each `// #region page/id` is cut out as the Compose version of the
// `<app-doc id>` with the same key in app.html. Kept in the sample so the compiler checks every snippet.

private val today = KometaDay(2026, 11, 16)

@Composable
internal fun ButtonSeverity() {
    // #region button/severity
    var clicks by remember { mutableIntStateOf(0) }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaButton("Primary", { clicks++ })
        KometaButton("Secondary", {}, severity = KometaSeverity.Secondary)
        KometaButton("Danger", {}, severity = KometaSeverity.Danger)
    }
    BasicText("Primary clicked $clicks times.", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun ButtonInContext() {
    // #region button/in-context
    var payWith by remember { mutableStateOf("click") }
    var paying by remember { mutableStateOf(false) }
    var paid by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaWords(
            listOf(KometaWordOption("click", "Click"), KometaWordOption("payme", "Payme"), KometaWordOption("cash", "Cash")),
            payWith, { payWith = it }, description = "Pay with",
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            KometaButton("Back", {}, severity = KometaSeverity.Secondary, variant = KometaButtonVariant.Outlined, enabled = !paying)
            KometaButton(
                if (paid) "Paid ✓" else "Pay 185 000 so'm", { paying = true; paid = true },
                loading = paying && !paid, enabled = !paid, iconRight = true, icon = { BasicText("→") },
            )
        }
    }
    // #endregion
}

@Composable
internal fun ButtonVariants() {
    // #region button/variants
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaButton("Outlined", {}, variant = KometaButtonVariant.Outlined)
        KometaButton("Text", {}, variant = KometaButtonVariant.Text)
        KometaButton("Small", {}, small = true)
    }
    // #endregion
}

@Composable
internal fun ButtonStates() {
    // #region button/states
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaButton("Loading", {}, loading = true)
        KometaButton("Disabled", {}, enabled = false)
    }
    // #endregion
}

@Composable
internal fun ButtonFluid() {
    // #region button/fluid
    KometaButton("Fluid", {}, Modifier.fillMaxWidth())
    // #endregion
}

@Composable
internal fun ButtonIcon() {
    // #region button/icon
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaButton("Add", {}, icon = { BasicText("+") })
        KometaButton("Next", {}, iconRight = true, icon = { BasicText("→") })
    }
    // #endregion
}

@Composable
internal fun SelectBasic() {
    // #region select/basic
    var city by remember { mutableStateOf<String?>(null) }
    KometaSelect(listOf("Tashkent", "Samarkand", "Bukhara"), city, { city = it }, placeholder = "City", description = "City")
    BasicText("City: ${city ?: ""}", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

private data class Member(val name: String, val role: String, val branch: String)

@Composable
internal fun SelectInContext() {
    // #region select/in-context
    val team = listOf(
        Member("Dilnoza Karimova", "Stylist", "Chilonzor"),
        Member("Jasur Aliev", "Barber", "Yunusobod"),
        Member("Malika Tursunova", "Admin", "Chilonzor"),
    )
    var branch by remember { mutableStateOf("All") }
    var role by remember { mutableStateOf("All") }
    val shown = team.filter { (branch == "All" || it.branch == branch) && (role == "All" || it.role == role) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            KometaSelect(listOf("All", "Chilonzor", "Yunusobod"), branch, { branch = it }, pill = true, prefix = "Branch:", description = "Branch")
            KometaSelect(listOf("All", "Stylist", "Barber", "Admin"), role, { role = it }, pill = true, prefix = "Role:", description = "Role")
        }
        shown.forEach { KometaPerson(it.name, meta = it.role) }
        if (shown.isEmpty()) KometaQuiet("Nobody here yet", hint = "No one with that role works at this branch.")
    }
    // #endregion
}

@Composable
internal fun SelectPill() {
    // #region select/pill
    var city by remember { mutableStateOf<String?>("Tashkent") }
    KometaSelect(listOf("Tashkent", "Samarkand", "Bukhara"), city, { city = it }, pill = true, prefix = "City:", description = "City pill")
    // #endregion
}

@Composable
internal fun SelectEmpty() {
    // #region select/empty
    KometaSelect(emptyList<String>(), null, {}, emptyLabel = "No results", placeholder = "Empty list", description = "Empty select")
    // #endregion
}

@Composable
internal fun DateBasic() {
    // #region date/basic
    var day by remember { mutableStateOf<KometaDay?>(null) }
    // Compose has no clock in common code: pass today in, from kotlinx-datetime or the platform.
    KometaDate(day, { day = it }, today = today, description = "Day")
    BasicText("Day: ${day?.let { "${it.day}.${it.month}.${it.year}" } ?: "—"}", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun DateRange() {
    // #region date/range
    var period by remember { mutableStateOf<Pair<KometaDay, KometaDay?>?>(null) }
    KometaDateRange(period, { period = it }, today = today, description = "Period")
    // #endregion
}

@Composable
internal fun DateRangeInline() {
    // #region date/range-inline
    var stay by remember { mutableStateOf<Pair<KometaDay, KometaDay?>?>(null) }
    KometaDateRange(stay, { stay = it }, today = today, inline = true, description = "Stay")
    // #endregion
}

@Composable
internal fun DateInline() {
    // #region date/inline
    var day by remember { mutableStateOf<KometaDay?>(null) }
    KometaDate(day, { day = it }, today = today, inline = true, description = "Inline day")
    // #endregion
}

@Composable
internal fun DateWeekStart() {
    // #region date/week-start
    var day by remember { mutableStateOf<KometaDay?>(null) }
    KometaDate(day, { day = it }, today = today, inline = true, weekStart = 0, description = "Sunday-first day")
    // #endregion
}

/** One docs example as the site's Compose preview draws it; [room] is extra height (dp) for a popup to open into. */
internal class DocExample(val room: Int = 0, val content: @Composable () -> Unit)

/** Every docs example by its key, so the browser build can draw it in place of the Angular preview. */
// by lazy: top-level vals of other files may not be initialised yet when this file's are.
internal val DOC_EXAMPLES by lazy {
    BASE_EXAMPLES + FORM_A_EXAMPLES + FORM_B_EXAMPLES + ACTIONS_EXAMPLES + DATA_EXAMPLES + OVERLAYS_EXAMPLES + MEDIA_EXAMPLES + MISC_EXAMPLES
}

private val BASE_EXAMPLES = mapOf(
    "button/severity" to DocExample { ButtonSeverity() },
    "button/in-context" to DocExample { ButtonInContext() },
    "button/variants" to DocExample { ButtonVariants() },
    "button/states" to DocExample { ButtonStates() },
    "button/fluid" to DocExample { ButtonFluid() },
    "button/icon" to DocExample { ButtonIcon() },
    "select/basic" to DocExample(200) { SelectBasic() },
    "select/in-context" to DocExample(220) { SelectInContext() },
    "select/pill" to DocExample(200) { SelectPill() },
    "select/empty" to DocExample(120) { SelectEmpty() },
    "date/basic" to DocExample(380) { DateBasic() },
    "date/range" to DocExample(380) { DateRange() },
    "date/range-inline" to DocExample { DateRangeInline() },
    "date/inline" to DocExample { DateInline() },
    "date/week-start" to DocExample { DateWeekStart() },
)
