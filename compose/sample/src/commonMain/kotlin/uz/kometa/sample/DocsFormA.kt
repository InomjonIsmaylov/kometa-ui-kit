package uz.kometa.sample

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import uz.kometa.ui.*

// Docs examples for the form pages field … stepper; see Docs.kt for how regions become Kotlin tabs.

private val passwordRules = listOf(
    KometaRule("8 letters") { it.length >= 8 },
    KometaRule("a number", Regex("\\d")),
    KometaRule("a capital", Regex("[A-Z]")),
    KometaRule("a symbol", Regex("[^\\w\\s]")),
)

@Composable
internal fun FieldBasic() {
    // #region field/basic
    var name by remember { mutableStateOf("Dilnoza") }
    KometaField(name, { name = it }, label = "Name", maxLength = 40, showCount = true)
    // #endregion
}

@Composable
internal fun FieldInContext() {
    // #region field/in-context
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var terms by remember { mutableStateOf(false) }
    var tried by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    val valid = name.trim().length > 1 && phone.length == 9 && terms
    LaunchedEffect(busy) { if (busy) { delay(900); busy = false } }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BasicText("Join Kometa as a master", style = Kometa.type.title)
        KometaField(
            name, { name = it }, label = "Full name",
            error = if (tried && name.trim().length < 2) "Enter your full name." else "",
        )
        KometaDigits(phone, { phone = it }, label = "Phone", placeholder = "90 123 45 67", small = true)
        KometaCheck("I accept the terms of service", terms, { terms = it })
        if (tried && !valid) BasicText("Check the name, a 9-digit phone and the terms.", style = Kometa.type.small.copy(color = Kometa.colors.error))
        KometaButton("Create account", { tried = true; if (valid) busy = true }, Modifier.fillMaxWidth(), loading = busy)
    }
    // #endregion
}

@Composable
internal fun FieldInvalid() {
    // #region field/invalid
    var email by remember { mutableStateOf("") }
    KometaField(
        email, { email = it }, label = "Email", error = "Enter a valid email.",
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
    )
    // #endregion
}

@Composable
internal fun FieldSizes() {
    // #region field/sizes
    var small by remember { mutableStateOf("") }
    KometaField("Read only", {}, label = "Read only", readOnly = true)
    KometaField(small, { small = it }, label = "Small", small = true)
    // #endregion
}

@Composable
internal fun FieldPlaceholder() {
    // #region field/placeholder
    var phone by remember { mutableStateOf("") }
    KometaField(phone, { phone = it }, label = "Phone", placeholder = "+998 90 123 45 67")
    // #endregion
}

@Composable
internal fun SearchBasic() {
    // #region search/basic
    var query by remember { mutableStateOf("") }
    KometaSearch(query, { query = it }, label = "Search clients", placeholder = "Search clients", clearLabel = "Clear")
    // #endregion
}

private data class Client(val name: String, val phone: String, val tag: String, val tone: KometaTagTone)

@Composable
internal fun SearchInContext() {
    // #region search/in-context
    val clients = listOf(
        Client("Dilnoza Karimova", "+998 90 123 45 67", "Regular", KometaTagTone.Done),
        Client("Aziz Rahimov", "+998 91 555 20 10", "New", KometaTagTone.Book),
        Client("Malika Yusupova", "+998 93 410 77 02", "VIP", KometaTagTone.Now),
        Client("Sardor Tursunov", "+998 97 300 11 45", "2 no-shows", KometaTagTone.Warn),
    )
    var query by remember { mutableStateOf("") }
    val q = query.lowercase().filterNot { it.isWhitespace() }
    val hits = clients.filter { (it.name + it.phone).lowercase().filterNot { c -> c.isWhitespace() }.contains(q) }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        KometaSearch(query, { query = it }, label = "Find a client", placeholder = "Name or phone", clearLabel = "Clear")
        hits.forEach { KometaPerson(it.name, meta = it.phone, size = KometaPersonSize.Sm, trailing = { KometaTag(it.tag, tone = it.tone) }) }
        if (hits.isEmpty()) KometaQuiet("No one by that name", hint = "Check the spelling, or add them as a new client.")
    }
    // #endregion
}

@Composable
internal fun SearchStates() {
    // #region search/states
    KometaSearch("Locked", {}, label = "Disabled search", enabled = false)
    // #endregion
}

@Composable
internal fun NotesBasic() {
    // #region notes/basic
    var note by remember { mutableStateOf("") }
    KometaNotes(note, { note = it }, label = "Note", maxLength = 200, placeholder = "A note for the master")
    // #endregion
}

@Composable
internal fun NotesInContext() {
    // #region notes/in-context
    val phrases = listOf("Short on the sides", "Keep the length", "Beard trim too", "A quiet visit, please")
    var memo by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaPerson("Aziz Rahimov", meta = "Haircut · today, 14:30")
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            phrases.forEach { p ->
                KometaChip(p, memo.contains(p), { on ->
                    val rest = memo.split(". ").filter { it.isNotEmpty() && it != p }
                    memo = (if (on) rest + p else rest).joinToString(". ")
                })
            }
        }
        KometaNotes(memo, { memo = it }, label = "Note for the master", maxLength = 160, placeholder = "Anything Aziz should know")
        KometaButton(if (sent) "Sent ✓" else "Send to Aziz", { sent = true }, small = true, enabled = memo.isNotBlank())
    }
    // #endregion
}

@Composable
internal fun NotesReadonly() {
    // #region notes/readonly
    KometaNotes("Read only note", {}, label = "Read only note", readOnly = true)
    // #endregion
}

@Composable
internal fun CodeBasic() {
    // #region code/basic
    var code by remember { mutableStateOf("") }
    KometaCode(code, { code = it }, label = "Confirmation code")
    BasicText("Code: ${code.ifEmpty { "—" }}", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun CodeInContext() {
    // #region code/in-context
    var otp by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BasicText("We sent a code to +998 90 *** 45 67. In this demo it is 482915.", style = Kometa.type.body)
        KometaCode(otp, { otp = it }, label = "SMS code")
        if (otp.length == 6) {
            if (otp == "482915") KometaBanner("Phone confirmed. Your visit on Friday at 11:00 is booked.", tone = KometaBannerTone.Ok)
            else KometaBanner("That code does not match. Check the SMS and try again.", tone = KometaBannerTone.Error)
        }
        KometaWord("Send the code again", { otp = "" }, quiet = true)
    }
    // #endregion
}

@Composable
internal fun CodeMask() {
    // #region code/mask
    var pin by remember { mutableStateOf("") }
    KometaCode(pin, { pin = it }, label = "PIN", placeholder = "·", mask = true)
    // #endregion
}

@Composable
internal fun DigitsBasic() {
    // #region digits/basic
    var pin by remember { mutableStateOf("") }
    KometaDigits(pin, { pin = it }, label = "PIN")
    BasicText("Digits: ${pin.ifEmpty { "—" }}", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun DigitsInContext() {
    // #region digits/in-context
    var phone by remember { mutableStateOf("") }
    var asked by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaPerson("Kometa Barbershop", meta = "Chilonzor, Tashkent · open till 21:00", square = true)
        if (asked) {
            KometaBanner("We will call +998 $phone within 10 minutes.", tone = KometaBannerTone.Ok)
        } else {
            BasicText("Leave your number and the administrator calls you back.", style = Kometa.type.small.copy(color = Kometa.colors.muted))
            KometaDigits(phone, { phone = it }, label = "Your phone", placeholder = "90 123 45 67")
            KometaButton("Call me back", { asked = true }, enabled = phone.length >= 9)
        }
    }
    // #endregion
}

@Composable
internal fun DigitsPhone() {
    // #region digits/phone
    var phone by remember { mutableStateOf("") }
    KometaDigits(phone, { phone = it }, label = "Phone", prefix = "+7", placeholder = "900 000 00 00")
    KometaDigits("", {}, label = "Disabled phone", enabled = false)
    // #endregion
}

@Composable
internal fun NumberBasic() {
    // #region number/basic
    var quantity by remember { mutableStateOf<Long?>(42) }
    KometaNumber(quantity, { quantity = it }, label = "Quantity")
    // #endregion
}

private data class Service(val name: String, val minutes: Int, val price: Long?)

@Composable
internal fun NumberInContext() {
    // #region number/in-context
    val prices = remember {
        mutableStateListOf(
            Service("Haircut", 40, 80000), Service("Beard trim", 20, 40000),
            Service("Haircut and beard", 60, 110000), Service("Kids haircut", 30, 60000),
        )
    }
    val average = prices.sumOf { it.price ?: 0 } / prices.size
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        KometaHeading("Price list") { KometaWord("Save", {}) }
        prices.forEachIndexed { i, s ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.width(150.dp)) {
                    BasicText(s.name, style = Kometa.type.body)
                    BasicText("${s.minutes} min", style = Kometa.type.small.copy(color = Kometa.colors.muted))
                }
                KometaNumber(s.price, { prices[i] = s.copy(price = it) }, label = "${s.name} price", money = true, suffix = "so'm")
            }
        }
        // Group thousands with spaces, as ru-RU does.
        val grouped = average.toString().reversed().chunked(3).joinToString(" ").reversed()
        BasicText("Average ticket: $grouped so'm", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    }
    // #endregion
}

@Composable
internal fun NumberMoney() {
    // #region number/money
    var amount by remember { mutableStateOf<Long?>(150000) }
    KometaNumber(amount, { amount = it }, label = "Price", money = true, suffix = "so'm")
    // #endregion
}

@Composable
internal fun NumberLocale() {
    // #region number/locale
    KometaNumber(5, {}, label = "Fixed count", readOnly = true)
    // #endregion
}

@Composable
internal fun SliderBasic() {
    // #region slider/basic
    var distance by remember { mutableIntStateOf(12) }
    KometaSlider(distance, { distance = it }, max = 20, unit = "km", label = "Distance")
    // #endregion
}

@Composable
internal fun SliderInContext() {
    // #region slider/in-context
    var radius by remember { mutableIntStateOf(4) }
    val nearby = (radius * 2.6).toInt()
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BasicText("Barbers near Chilonzor", style = Kometa.type.title)
        KometaSlider(radius, { radius = it }, min = 1, max = 15, unit = "km", label = "Search radius")
        KometaButton("Show $nearby shops", {}, Modifier.fillMaxWidth())
    }
    // #endregion
}

@Composable
internal fun SliderSliderSteps() {
    // #region slider/slider-steps
    var budget by remember { mutableIntStateOf(60000) }
    KometaSlider(budget, { budget = it }, min = 10000, max = 200000, step = 5000, unit = "so'm", label = "Budget")
    // #endregion
}

@Composable
internal fun SliderSliderBare() {
    // #region slider/slider-bare
    var volume by remember { mutableIntStateOf(8) }
    KometaSlider(volume, { volume = it }, showFigure = false, label = "Volume")
    KometaSlider(5, {}, max = 10, enabled = false, label = "Locked")
    // #endregion
}

@Composable
internal fun HueBasic() {
    // #region hue/basic
    var colour by remember { mutableStateOf("#E7C255") }
    KometaHue(colour, { colour = it }, label = "Shop colour")
    // #endregion
}

@Composable
internal fun HueInContext() {
    // #region hue/in-context
    var brand by remember { mutableStateOf("#E7C255") }
    val brandColor = Color(("FF" + brand.removePrefix("#")).toLong(16))
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BasicText("Shop colour", style = Kometa.type.title)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.size(40.dp).background(brandColor, CircleShape), contentAlignment = Alignment.Center) {
                BasicText("U", style = Kometa.type.body.copy(color = Color.Black))
            }
            Column {
                BasicText("Usta Barber", style = Kometa.type.body)
                BasicText("Chilonzor · open till 21:00", style = Kometa.type.small.copy(color = Kometa.colors.muted))
            }
        }
        KometaHue(brand, { brand = it }, label = "Shop colour")
    }
    // #endregion
}

@Composable
internal fun HueHueFamily() {
    // #region hue/hue-family
    var colour by remember { mutableStateOf("") }
    KometaHue(colour, { colour = it }, count = 12, saturation = 55f, lightness = 45f, label = "Label colour")
    // #endregion
}

@Composable
internal fun RulesBasic() {
    // #region rules/basic
    var password by remember { mutableStateOf("") }
    KometaField(password, { password = it }, label = "Password", password = true)
    KometaRules(password, passwordRules, description = "Password needs")
    // #endregion
}

@Composable
internal fun RulesInContext() {
    // #region rules/in-context
    var phone by remember { mutableStateOf("+998 90 123 45 67") }
    var password by remember { mutableStateOf("") }
    val ready = passwordRules.all { it.test(password) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BasicText("Create your shop account", style = Kometa.type.title)
        KometaField(phone, { phone = it }, label = "Phone", keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone))
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            KometaField(password, { password = it }, label = "Password", password = true)
            KometaRules(password, passwordRules, description = "Password needs")
        }
        KometaButton("Create account", {}, Modifier.fillMaxWidth(), enabled = ready)
    }
    // #endregion
}

@Composable
internal fun InplaceBasic() {
    // #region inplace/basic
    var shopName by remember { mutableStateOf("Usta Barber") }
    KometaInplace(shopName, { shopName = it }, label = "Shop name")
    // #endregion
}

@Composable
internal fun InplaceInContext() {
    // #region inplace/in-context
    var phone by remember { mutableStateOf("+998 90 123 45 67") }
    var usual by remember { mutableStateOf("Low fade, no beard") }
    var note by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        KometaPerson("Anvar Karimov", meta = "Client since March")
        listOf(
            Triple("Phone", phone) { v: String -> phone = v },
            Triple("Usual", usual) { v: String -> usual = v },
            Triple("Note", note) { v: String -> note = v },
        ).forEach { (term, value, set) ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                BasicText(term, Modifier.width(72.dp), style = Kometa.type.small.copy(color = Kometa.colors.muted))
                KometaInplace(value, set, placeholder = if (term == "Note") "Add a note" else "", label = term)
            }
        }
    }
    // #endregion
}

@Composable
internal fun InplaceInplaceStates() {
    // #region inplace/inplace-states
    var nickname by remember { mutableStateOf("") }
    KometaInplace(nickname, { nickname = it }, placeholder = "Add a nickname", label = "Nickname")
    KometaInplace("Main branch", {}, label = "Branch", enabled = false)
    // #endregion
}

@Composable
internal fun StepperBasic() {
    // #region stepper/basic
    var seats by remember { mutableIntStateOf(2) }
    KometaStepper(seats, { seats = it }, min = 1, max = 6, unit = "seats", label = "Seats", decrementLabel = "Fewer", incrementLabel = "More")
    // #endregion
}

@Composable
internal fun StepperInContext() {
    // #region stepper/in-context
    val chairs = 6
    var guests by remember { mutableIntStateOf(3) }
    val price = (guests * 80000).toString().reversed().chunked(3).joinToString(" ").reversed()
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BasicText("Saturday, 10:00 · Wedding party", style = Kometa.type.title)
        KometaStepper(
            guests, { guests = it }, min = 1, max = chairs, unit = "guests", label = "Guests",
            decrementLabel = "Fewer guests", incrementLabel = "More guests",
        )
        KometaMeter(guests, chairs, label = "chairs taken at 10:00")
        KometaButton("Book $guests chairs · $price so'm", {}, Modifier.fillMaxWidth())
    }
    // #endregion
}

@Composable
internal fun StepperIcons() {
    // #region stepper/icons
    KometaStepper(3, {}, readOnly = true, label = "Fixed seats")
    // #endregion
}

/** This file's regions by key, merged into [DOC_EXAMPLES]. */
internal val FORM_A_EXAMPLES = mapOf(
    "field/basic" to DocExample { FieldBasic() },
    "field/in-context" to DocExample { FieldInContext() },
    "field/invalid" to DocExample { FieldInvalid() },
    "field/sizes" to DocExample { FieldSizes() },
    "field/placeholder" to DocExample { FieldPlaceholder() },
    "search/basic" to DocExample { SearchBasic() },
    "search/in-context" to DocExample { SearchInContext() },
    "search/states" to DocExample { SearchStates() },
    "notes/basic" to DocExample { NotesBasic() },
    "notes/in-context" to DocExample { NotesInContext() },
    "notes/readonly" to DocExample { NotesReadonly() },
    "code/basic" to DocExample { CodeBasic() },
    "code/in-context" to DocExample { CodeInContext() },
    "code/mask" to DocExample { CodeMask() },
    "digits/basic" to DocExample { DigitsBasic() },
    "digits/in-context" to DocExample { DigitsInContext() },
    "digits/phone" to DocExample { DigitsPhone() },
    "number/basic" to DocExample { NumberBasic() },
    "number/in-context" to DocExample { NumberInContext() },
    "number/money" to DocExample { NumberMoney() },
    "number/locale" to DocExample { NumberLocale() },
    "slider/basic" to DocExample { SliderBasic() },
    "slider/in-context" to DocExample { SliderInContext() },
    "slider/slider-steps" to DocExample { SliderSliderSteps() },
    "slider/slider-bare" to DocExample { SliderSliderBare() },
    "hue/basic" to DocExample { HueBasic() },
    "hue/in-context" to DocExample { HueInContext() },
    "hue/hue-family" to DocExample { HueHueFamily() },
    "rules/basic" to DocExample { RulesBasic() },
    "rules/in-context" to DocExample { RulesInContext() },
    "inplace/basic" to DocExample { InplaceBasic() },
    "inplace/in-context" to DocExample { InplaceInContext() },
    "inplace/inplace-states" to DocExample { InplaceInplaceStates() },
    "stepper/basic" to DocExample { StepperBasic() },
    "stepper/in-context" to DocExample { StepperInContext() },
    "stepper/icons" to DocExample { StepperIcons() },
)
