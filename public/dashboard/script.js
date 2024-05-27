const socket = io();

let programList = [];

socket.on("programs", (programs) => {
  programList = programs;
  updateProcessList();
});

function getProcessInfo() {
  return programList;
}

function updateProcessList() {
  const processList = document.getElementById("process-list-body");
  processList.innerHTML = "";

  const processes = getProcessInfo();

  processes.forEach((process) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${process.name}</td>
          <td>${process.port}</td>
          <td><button class="inspect-btn">Inspect</button></td>
      `;
    processList.appendChild(row);

    const inspectButton = row.querySelector(".inspect-btn");
    inspectButton.addEventListener("click", () => {
      window.location.href = "/inspect/" + process.uuid;
    });
  });
}
const addProcessForm = document.querySelector(".add-process form");

addProcessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const processName = document.getElementById("process-name").value;
  const processGitHub = document.getElementById("process-github").value;
  const processZip = document.getElementById("process-zip").files[0];
  const processPort = document.getElementById("process-port").value;
  if (processGitHub) {
    console.log(
      `Adding process ${processName} from GitHub: ${processGitHub} on port ${processPort}`
    );
  } else if (processZip) {
    console.log(
      `Adding process ${processName} from ZIP file on port ${processPort}`
    );
    handleZipUpload(processZip);
  }
  addProcessForm.reset();
});

function handleZipUpload(zipFile) {
  const reader = new FileReader();
  reader.onload = () => {
    const zipData = reader.result;
    console.log("ZIP file data:", zipData);
  };
  reader.readAsArrayBuffer(zipFile);
}

let jokes = [
  "When the window fell into the incinerator, it was a pane in the ash to retrieve.",
  "What's a pirate's favorite letter? It be the Sea",
  "How do you count cows? A 'Cow'culator",
  "Did you hear about the guy whose whole left side was cut off? He's all right now.",
  "My friend's bakery burned down last night. Now his business is toast.",
  "Two peanuts were walking down the street. One was a salted.",
  "My son asked me to stop singing Oasis songs in public. I said maybe.",
  "I used to be a banker but I lost interest",
  "Why did the golfer bring two pairs of pants? In case he got a hole-in-one.",
  "To the man in the wheelchair that stole my camouflage jacket; You can hide, but you can't run.",
  "When my wife told me to stop impersonating a flamingo, I had to put my foot down.",
  "The rotation of earth really makes my day.",
  "Why do chicken coops only have two doors? Because if they had four, they would be chicken sedans.",
  "How do you find Will Smith in the snow? You look for the fresh prints.",
  'A proton, an electron, & a neutron walk into a bar. The proton orders a shot, drinks it, pulls out his wallet, and pays the bartender. The electron orders a shot, drinks it, pulls out his wallet, and pays the bartender. The neutron orders a shot, drinks it, then pulls out his wallet. The bartender stops him and says, "for you, no charge..."',
  'Two atoms are walking down the street. One says, "Oh no! I lost an electron!", The other asks him, "Are you sure?", The first one says, "Yeah, I\'m positive"',
  'A ham sandwich walks into a bar and orders a beer. The bartender looks at him and says, "Sorry we don\'t serve food here."',
  "What is Beethoven's favorite fruit? A ba-na-na-na.",
  "I had a dream that I was a muffler last night. I woke up exhausted.",
  "Two guys walk into a bar, the third one ducks.",
  "What time did the man go to the dentist? Tooth hurt-y.",
  "Found out I was colour blind the other day... That one came right out the purple.",
  "Where are average things built? In the satisfactory.",
  "Yesterday a clown held a door open for me. I thought it was a nice jester.",
  "Just read a few facts about frogs. They were ribbiting.",
  "I just swapped our bed for a trampoline. My wife hit the roof.",
  "Astronomers got tired of watching the moon go round the earth for 24 hours, so they decided to call it a day.",
  'I asked the checkout girl for a date. She said "They\'re in the fruit aisle next to the bananas."',
  "What's the difference between a well dressed man on a a bicycle and a poorly dressed man on a tricycle? Attire!",
  "What did the pirate say on his 80th birthday? Aye matey",
  "What do you call a sketchy Italian neighbourhood? The Spaghetto.",
  "I have kleptomania, but when it gets bad, I take something for it.",
  "Doorbells, don't knock 'em.",
  "My wife is on a tropical food diet, the house is full of the stuff. It's enough to make a mango crazy.",
  "Whiteboards are remarkable.",
  "Why do so many people with laser hair want to get it removed?",
  "What has twenty legs and flies? Ten pairs of pants.",
  "What has twenty legs and flies? Five dead Horses.",
  "What do you call a fish with no eyes? Fsh.",
  "What do you get if you cross the Atlantic with the Titanic? About halfway.",
  "Why do bakers work so hard? They knead the dough.",
  "What do you call a man with a rug on his head? Matt.",
  "Why shouldn't you play cards in the jungle? Too many cheetahs.",
  "What's big, red, and eats rocks? A big, red, rock-eater.",
  "How do you make toast in the jungle? Pop your bread under a g'rilla.",
  "What lies on the ocean floor and shivers? A nervous wreck.",
  "Who is the quickest draw in the ocean? Billy the Squid.",
  "What's the difference between a jeweller and a prison warden? One sells watches, and the other watches cells.",
  "What's brown and sticky? A stick.",
  "Why did the banana go to the doctors'? He wasn't peeling very well.",
  "Where did Napoleon keep his armies? Up his sleevies.",
  "Where are the Andes? At the end of your armies.",
  "What do you get when you run over a bird with your lawnmower? Shredded tweet.",
  "What do you get if you drop a piano down a coal shaft? A flat minor.",
  "How does a burglar get into your house? Intruder window.",
  "What's worse than finding a worm in your apple? Finding half a worm.",
  "What is the richest country in the world? Ireland. Its capital is always Dublin.",
  "What do you call a sheep with no legs? A cloud.",
  "What was Beethoven's fifth favorite fruit? Ba-na-na-na.",
  "What did the green grape say to the purple grape? Breathe, you fool, breathe!",
  "How do you turn a duck into a soul singer? Put it in a microwave until its bill withers.",
  "Last night me and my girlfriend watched three movies back to back. Luckily I was the one facing the TV.",
  "I've deleted the phone numbers of all the Germans I know from my mobile phone. Now it's Hans free.",
  "Why did the octopus beat the shark in a fight? Because it was well armed.",
  "A red and a blue ship have just collided in the Caribbean. Apparently the survivors are marooned.",
  "What's the advantage of living in Switzerland? Well, the flag is a big plus.",
  "I am terrified of elevators. I'm going to start taking steps to avoid them.",
  "I dreamed about drowning in an ocean made out of orange soda last night. It took me a while to work out it was just a Fanta sea.",
  "My cat just threw up on the carpet. I don't think it's feline well.",
  "I went to the doctor today and he told me I had type A blood, but it was a type O.",
  "Today a girl said she recognized me from vegetarian club, but I'm sure I've never met herbivore.",
  "Why do crabs never give to charity? Because they're shellfish.",
  "People keep making apocalypse jokes like there's no tomorrow.",
  "If you're struggling to think of what to get someone for Christmas. Get them a fridge, and watch their face light up when they open it.",
  "I was thinking about moving to Moscow but there is no point Russian into things.",
  "Did you hear about the new restaurant on the moon? The food is great, but there's just no atmosphere.",
  "Milk is also the fastest liquid on earth. It's pasteurized before you even see it.",
  'Did you hear that the police have a warrant out on a midget psychic ripping people off? It reads "Small medium at large."',
  "A steak pun is a rare medium well done.",
  "Singing in the shower is all fun and games until you get shampoo in your mouth. Then it's a soap opera.",
  "Why can't you hear a pterodactyl using the bathroom? Because the P is silent.",
  "The price of bouncy castles have doubled this year. That's inflation for you.",
  "Whenever I want to start eating healthy, a chocolate bar looks at me and Snickers.",
  "What do you get hanging off banana trees? Sore arms.",
  "I hate perforated lines, they're tearable.",
  "What do you call a fat psychic? A four-chin teller.",
  'A Mexican magician says he\'ll disappear on the count of 3; "Uno... dos... poof...". He disappeared without a tres.',
  "What's the difference between a hippo and a Zippo? One is heavy, and the other is a little lighter.",
];
document.getElementById("joke").innerHTML =
  jokes[Math.round(Math.random() * (jokes.length - 1))];
