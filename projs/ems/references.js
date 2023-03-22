// Button component 
const Button = (props) => (
    // props.msg is text 
    // props.link is hyperlink
    //props.color is color of the button 
    //props.id is individual id of each button
    <div>
        <a className="button" id={props.id} href={props.link} target="_blank"  style={{backgroundColor:props.color}}>
            {props.msg}
        </a>
    </div>
)

const navBarStyle = {
    color: "white",
    textDecoration: "none"
}


// Navigation bar component at the top of the page 
function Navbar()
{
    return (
        <div className="navbar">
            <a href='./index.html' style={navBarStyle}>
                <h1> EMS References Collection </h1>
            </a>
        </div>
    )
}
function Buttons() {
    return (
    <div className="buttons">        
        <Button msg={"EMS Protocol (08.30.2022)"} link={"https://www.miemss.org/home/Portals/0/Docs/Guidelines_Protocols/MD-Medical-Protocols-2022-Print-20220830-min.pdf"} id={"protocurrent"} color="navy"/>
        <Button msg={"Peds Vitals"} link={"https://www.pedscases.com/sites/default/files/Vitals%20Chart_PedsCases%20Notes.pdf"} id={"pvital"} color="#ff32c2"/>
        <Button msg={"Drug Search"} link={"https://www.drugs.com/sitemap.html"} id={"htsd"} color="#189ada"/>
        <Button msg={"Signature Matrix"} link={"https://montgomerycountymd.gov/frs-ql/Resources/Files/ems/ql/emsdocs/elite_signature_matrix_2020.pdf"} id={"sm"} color="purple"/>
        <Button msg={"Lab Values (A)"} link={"https://nurseslabs.com/normal-lab-values-nclex-nursing/"} id={"labsa"} color="#aeaeff"/>
        <Button msg={"Lab Values (B)"} link={"https://www.registerednursing.org/nclex/laboratory-values/"} id={"labsb"} color="#98D9B6"/>
    </div>
    )
}


function App()
{
    return(
        <div className="buttonCollection">
            <Navbar />
            <div>
                <Buttons />
            </div>
        </div>
    )
}

ReactDOM.render(<App />, document.getElementById("root2"))