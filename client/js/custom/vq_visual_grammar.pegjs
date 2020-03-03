{
	function makeVar(o) {return makeString(o);};
}

	Main = (Var / NumberValue / BooleanLiteral / RDFLiteral / StringQuotes  / IRIREFName)
	//Chars_String = (([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_") ([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_" / [0-9])*)
	space = ((" ")*) {return }
	Var = (VAR1 / VAR2) 
	VAR1 = "?" Var:VARNAME {return {value:makeVar(Var), type:"varName"}}
	VAR2 = "$" Var:VARNAME {return {value:makeVar(Var), type:"varName"}}
	VARNAME = (([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_") ([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_" / [0-9])*)
	
	NumberValue = Number:Number "^^" iri:IntegerIRI {return {value:makeVar(Number), type:"number"}}
	
	BooleanLiteral = BooleanLiteral:(TRUE/ FALSE) "^^" BooleanIRI {return {value:makeVar(BooleanLiteral), type:"boolean"}}
			
	TRUE = ("'" "true"i "'") / ('"' "true"i '"' ) {return "true"}
	FALSE = ("'" "false"i "'") / ('"' "false"i '"' ) {return "false"}
	
	StringQuotes = StringQuotes:(STRING_LITERAL1  / STRING_LITERAL2) {return {value:makeVar(StringQuotes), type:"string"}}
	STRING_LITERAL1 = "'" string "'"
	STRING_LITERAL2 = '"' string '"'
	string = string:(([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / [0-9] / [-_.:, ^$])+)
	
	IntegerIRI = "http://www.w3.org/2001/XMLSchema#integer";
	BooleanIRI = "http://www.w3.org/2001/XMLSchema#boolean";
	
	Number = Number1 / Number2
	Number1 = "'" Number:[0-9]+ "'" {return Number}
	Number2 = '"' Number:[0-9]+ '"' {return Number}
	
	RDFLiteral = (RDFLiteral:(RDFLiteralA/RDFLiteralB)) {return {value:makeVar(RDFLiteral), type:"RDFLiteral"}}
	RDFLiteralA = String:((STRING_LITERAL1  / STRING_LITERAL2) LANGTAG) {return makeVar(String)}
	RDFLiteralB = String:((STRING_LITERAL1  / STRING_LITERAL2) "^^" iri) {return makeVar(String)}
	
	LANGTAG = "@" string
	
	IRIREFName = IRIREF:(("http://" / "https://")([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_" / ":" / "." / "#" / "/" / "-" / [0-9])*) {return {value:makeVar(IRIREF), type:"iri"}}
	
	iri = (IRIREF: IRIREF / PrefixedName: PrefixedName)
	//IRIREF = IRIREF:("<" ([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_" / ":" / "." / "#" / "/" / [0-9])* ">") {return makeVar(IRIREF)}
	IRIREF = IRIREF:(([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_" / ":" / "." / "#" / "/" / [0-9])*) {return makeVar(IRIREF)}
	PrefixedName = PrefixedName:(PNAME_LN) {return {PrefixedName:PrefixedName}}
	PNAME_NS = Prefix:(PN_PREFIX? ":") {return makeVar(Prefix)}
	PNAME_LN = (LName:(PNAME_NS  Chars_String)) {return makeVar(LName)}
	PN_PREFIX = Chars_String_prefix
	Chars_String_prefix = (([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_" / "-") ([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_" / "-" / [0-9])*)
	Chars_String = (([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_") ([A-Za-zāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ] / "_" / [0-9])*)
			

			
			
			
			
			
			