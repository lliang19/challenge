# Submission

## Overview

In this challenge, I brainstormed a bunch of different ways to design and implement an algorithm (or in my case, a set of algorithms) that was clean, efficient, and performed well, using average score as the base metric of that criteria. Throughout the implementation, I realized that there were some key problems that I had to solve for that I denote throughout this doc with a superscripted number<sup>[#]</sup>. After racking my brain around and taking a stab at this challenge, I boiled my implementation down to two main components: a <b>weight</b> algorithm and a <b>memoization</b> type algorithm.

## Running Pacman

I didn't make any changes to the startup script, so a simple <code>npm run</code> will spin up the environment and start Pacman. I debated implementing a switch to preserve Pacman's original key-based movements, but I decided not to for the sake of time (and because I had already deep dived into my current implementation haha). Upon starting up Pacman, I've tweaked the system to start off on the <code>WAITING</code> GameMode. I've added a label below <code>Iteration</code> called <code>Game Mode</code>, which indicates what state the game is in (Waiting, Playing, or Finished). Clicking "New Game" will start the next iteration, the same way it was originally implemented. Clicking on the "Reset Score" button will reset the score and iteration count as well as put the game back into <code>WAITING</code> mode. I introduced a new button "Run 100 Games", which will start up a completely new game starting at iteration 1 and continuously running subsequent iterations until 100 iterations. I also incorporated a Slider component to change the speed at which Pacman runs; this was helpful in testing since I could speed up and slow down Pacman dynamically.

Development-wise, I added the <code>lodash</code> package just to help with deep cloning 2D arrays (<code>_.cloneDeep()</code>) that I will explain later in this doc. Running <code>npm install</code> prior to starting up Pacman should install that dependency automatically.

## Implementation Design

When I was taking this challenge, I had messed around with a couple different variations of the algorithms that I ended up with, and ultimately settled on my current implementation as a "first stab" or "alpha" version of the algorithm. The breakdown of each piece is as follows:

### Weight Algorithm

This is the main driver behind my automated Pacman. The idea that I had was that given the restriction that Pacman could only see in front and to the sides of him, I had to extract as much information as possible in order for him to make an informed decision on which direction he should move<sup>[1]</sup>. After consulting Ezra and confirming that my ideas were valid/legal, I implemented a method <code>findItems</code> in <code>Item.ts</code>.

#### <code>findItems(directionKey: string, maxDistance: number): GameBoardItemCount</code>

This method computes the counts of each type of item (empty, biscuit, pill, ghost) in a given direction (up, down, left, right), with a limit on how far out to search, and returns them into an object of the following type:

<pre><code>
interface GameBoardItemCount {
  empty: number,
  biscuit: number,
  pill: number,
  ghost: number
}
</code></pre>

Using these counts, I created an arbitrary scale for which each item would have some "weight" associated with it:

<pre><code>
empty: 0
biscuit: 1
pill: pillTimer.timer > 3 ? -1 : 10
ghost: pillTimer.timer > 3 ? 20 : -20
</code></pre>

The two item types that I placed conditions to their weight were the pill and the ghost. I wanted to slightly discourage Pacman from trying to pick up another pill if he had already recently eaten a pill, meaning that eating another pill might be less efficient in terms of being powered up for as long as possible throughout the game. I also placed a slight bias on ghosts, since I wanted to heavily encourage Pacman to "chase" any ghosts in his line of sight, unless he's at the tail end of his pill timer, for which I wanted him to avoid the ghosts as much as possible to not end up in a situation where he was powered up and chasing a Ghost, only to fall short one or two tics and end up being eaten by the Ghost.

Having these counts and weights, I simply took the sum of all the <code>itemCount * itemWeight</code> and mapped that total weight to its associated direction. I then look at all the valid directions and determined which one had the highest weight, and then I have Pacman take that direction on the next move.

A small tweak I made to this algorithm was unconditionally injecting a slight negative bias towards moving in the opposite direction. Since Pacman can't see behind him, I needed to make sure that in the situation where a Ghost is trailing right behind or 1 or 2 steps behind him, Pacman wouldn't accidentally move backwards and end up getting eaten by the Ghost<sup>[2]</sup>. I naively solved this (although I'm sure there's a better way to do this) by always subtracting a weight of <code>3</code> from Pacman's opposite direction.

### Memoization Algorithm

The other major piece behind Pacman's automated movements is a memoization algorithm. While testing my weight algorithm, I found that sometimes Pacman ends up in situations where he has cleared an area/corner of the board but cannot pathfind himself to the other corner(s)<sup>[3]</sup>. I realized that this was because the weight algorithm would always compute 0 in all directions at all/most of the spaces in that cleared area, so Pacman would more or less end up running in circles. To tackle this problem, I did two things, the latter being the more important one. I randomized Pacman's movments in the case that he came across two or more identical direction weights, and (more importantly) I created a "long term memory" for Pacman.

Memory, in this case, is a 2D number array consisting of empty spaces, bisuits, and pills. Normally, I would probably have Pacman organically generate his board by expanding the number of rows and columns based on his movement, but for the sake of this challenge (and after asking Ezra again), I fixed Pacman's "memory" to the size of the pre-defined board.

Implementation wise, Pacman has two copies of this "memory", both identical at the start of an iteration. The first of the two memories is used to keep track of all the biscuits and pills Pacman has eaten so far and their locations (across iterations), almost like a write-only memory, so theoretically Pacman should eventually know the location of all the biscuits and pills on the board. The second of the two memories is used to keep track of the current density of the board, relative to Pacman's current knowledge of the board, and is updated according to what Pacman has eaten, so theoretically it should end up emptied if Pacman survives until the very end.

I calculate density by splitting the board into four equal quadrants and computing the <code>sumOfElementsInQuadrant / totalAreaOfQuadrant</code>, with <code>totalAreaOfQuadrant = lengthOfQuadrant * widthOfQuadrant</code>. I then compare all four values against each other and find the quadrant with the highest density, which indicates that that quadrant (according to Pacman's knowledge in a given run) has the highest density of biscuits and pills left, so he should make his way over there to try and clear that area. This is computed on every tic, so once Pacman has cleard one area, if he "knows" that there is a higher density of biscuits and pills in another area, he will make his way over there. This more or less solves the previous problem of Pacman getting stuck in a corner. I then persist this long term memory across all 100 iterations, which should theoretically make Pacman better and better after each run.

## Analysis

Upon testing my algorithm, I found that Pacman performed decently well, with an average score of about 1300-1400 and with scores for each iteration ranging anywhere from a couple hundred to 2000+. Based on my observations, during the first 10-ish rounds, I noticed that Pacman has about a 20% chance of clearing 90% (most) of the board before being eaten. At about rounds 10-20, that rate increases and Pacman is able to more consistently clear most of the board (I'd say around 40%). Then, at about rounds <code>>30</code>, Pacman starts to peak in his performance and exhibit "diminishing returns", with an estimated probability of 60-65% of clearing most of the board. By round 50, there isn't too much of a differece in Pacman's performance, which makes sense since by this time Pacman would have probably traversed most if not all of the board.

Running Pacman to the full 100 iterations shows Pacman doing pretty well in my opinion (for the fairly simple nature of this algorithm). Prior to submitting this challenge, one of the best runs I've been able to see for Pacman is a total running score of 134240 across 100 rounds, which averages to about 1342.4 points per iteration.

## Future Notes

There were a couple problems that I couldn't tackle 100% because of the time constraint but also it probably wouldn't taken a substantially more amount of time to get those implemented:
- Pacman sucks at corners, since he can't see past the corner and often times will get eaten if a Ghost approaches from the other end of the corner.
- Pacman doesn't do well when he's being chased by two or more Ghosts from multiple directions, a common scenario is along a straight path with no turns available, if a Ghost is behind and in front of him then Pacman will most likely get eaten by either one.

Given more time to think about this and continue iterating on this, I would definitely have tried to tackle these persistant problems, as well as other problems that come up, and also fine tune the weights, scales, metrics, etc. that I arbitrarily came up with for this challenge.

## Final Thoughts

Overall, I really really enjoyed this challenge, as you probably are able to tell, and got a little over zealous with the implementation and analysis of this challenge, but I had a lot of fun. If you've made it this far into this doc and took the time to read through it, I appreciate it a lot and I hope to discuss this in further details soon!