
{ pkgs, ... }:

{
  packages = [
    pkgs.git
    pkgs.openssh
  ];
}
